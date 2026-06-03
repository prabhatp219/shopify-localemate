import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { generateSuggestion } from "../../services/openrouterSuggestionService.js";

// Market metadata — flags and colors per market name
const MARKET_META = {
  India:   { flag: "🇮🇳", tone: "bg-orange-50", color: "bg-teal-600" },
  USA:     { flag: "🇺🇸", tone: "bg-blue-50",   color: "bg-blue-600" },
  Germany: { flag: "🇩🇪", tone: "bg-amber-50",  color: "bg-amber-500" },
  Japan:   { flag: "🇯🇵", tone: "bg-rose-50",   color: "bg-rose-500" },
  MENA:    { flag: "🌙",  tone: "bg-green-50",  color: "bg-teal-600" },
};

function getMeta(market) {
  return MARKET_META[market] || { flag: "🌐", tone: "bg-gray-100", color: "bg-teal-600" };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function loader({ request }) {
  try {
    await authenticate.admin(request);
    const suggestions = await prisma.suggestion.findMany({
      orderBy: { createdAt: "desc" },
    });
    return jsonResponse({ success: true, suggestions });
  } catch (error) {
    console.error("[app.api.suggestions] loader error:", error);
    return jsonResponse({ success: false, error: "Failed to fetch suggestions." }, 500);
  }
}

export async function action({ request }) {
  try {
    await authenticate.admin(request);
    
    if (request.method.toUpperCase() !== "POST") {
      return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    }

    const body = await request.json();
    const { actionType, id, market, currentHeadline, currentDetail } = body;

    if (!actionType) {
      return jsonResponse({ success: false, error: "actionType is required" }, 400);
    }

    switch (actionType) {
      case "generate": {
        if (!market || !currentHeadline) {
          return jsonResponse({ success: false, error: "market and currentHeadline are required." }, 400);
        }
        const aiResult = await generateSuggestion(market, currentHeadline);
        const meta = getMeta(market);
        const suggestion = await prisma.suggestion.create({
          data: {
            market,
            flag: meta.flag,
            tone: meta.tone,
            color: meta.color,
            currentHeadline,
            currentDetail: currentDetail || "",
            suggestedHeadline: aiResult.suggestedHeadline,
            expectedLift: aiResult.expectedLift,
            confidence: aiResult.confidence,
            status: "pending",
          },
        });
        return jsonResponse({ success: true, suggestion }, 201);
      }

      case "apply": {
        if (!id) return jsonResponse({ success: false, error: "id is required" }, 400);
        const suggestion = await prisma.suggestion.update({
          where: { id },
          data: { status: "applied" },
        });
        return jsonResponse({ success: true, suggestion });
      }

      case "apply-all": {
        const result = await prisma.suggestion.updateMany({
          where: { status: "pending" },
          data: { status: "applied" },
        });
        return jsonResponse({ success: true, appliedCount: result.count });
      }

      case "review": {
        if (!id) return jsonResponse({ success: false, error: "id is required" }, 400);
        const suggestion = await prisma.suggestion.update({
          where: { id },
          data: { status: "under_review" },
        });
        return jsonResponse({ success: true, suggestion });
      }

      case "regenerate": {
        if (!id) return jsonResponse({ success: false, error: "id is required" }, 400);
        const existing = await prisma.suggestion.findUnique({ where: { id } });
        if (!existing) return jsonResponse({ success: false, error: "Suggestion not found." }, 404);

        const aiResult = await generateSuggestion(existing.market, existing.currentHeadline);
        const updated = await prisma.suggestion.update({
          where: { id },
          data: {
            suggestedHeadline: aiResult.suggestedHeadline,
            expectedLift: aiResult.expectedLift,
            confidence: aiResult.confidence,
            status: "pending",
          },
        });
        return jsonResponse({ success: true, suggestion: updated });
      }

      case "delete": {
        if (!id) return jsonResponse({ success: false, error: "id is required" }, 400);
        await prisma.suggestion.delete({ where: { id } });
        return jsonResponse({ success: true, message: "Suggestion deleted." });
      }

      default:
        return jsonResponse({ success: false, error: `Unknown action: ${actionType}` }, 400);
    }
  } catch (error) {
    console.error("[app.api.suggestions] action error:", error);
    
    // Handle Prisma record not found error code
    if (error.code === "P2025") {
      return jsonResponse({ success: false, error: "Record not found." }, 404);
    }
    
    return jsonResponse({ success: false, error: error.message || "Failed to execute suggestions action." }, 500);
  }
}
