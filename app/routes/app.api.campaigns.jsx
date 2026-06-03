import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { generateCampaignContent } from "../../services/openrouterService.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function loader({ request }) {
  try {
    await authenticate.admin(request);
    
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    if (idParam) {
      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        return jsonResponse({ success: false, error: "Invalid campaign ID." }, 400);
      }

      const campaign = await prisma.campaign.findUnique({
        where: { id },
      });

      if (!campaign) {
        return jsonResponse({ success: false, error: "Campaign not found." }, 404);
      }

      return jsonResponse({ success: true, campaign });
    }

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });
    return jsonResponse({ success: true, campaigns });
  } catch (error) {
    console.error("[app.api.campaigns] loader error:", error);
    return jsonResponse({ success: false, error: "Failed to fetch campaigns." }, 500);
  }
}

export async function action({ request }) {
  try {
    await authenticate.admin(request);

    if (request.method.toUpperCase() !== "POST") {
      return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    }

    const body = await request.json();
    const { actionType, id, title, market, productType, goal, tone, platform } = body;

    if (!actionType) {
      return jsonResponse({ success: false, error: "actionType is required" }, 400);
    }

    switch (actionType) {
      case "generate": {
        if (!title || !market) {
          return jsonResponse({
            success: false,
            error: "Campaign Title and Target Market are required fields.",
          }, 400);
        }

        const generatedContent = await generateCampaignContent({
          title,
          market,
          productType,
          goal,
          tone,
          platform,
        });

        const campaign = await prisma.campaign.create({
          data: {
            title,
            market,
            productType: productType || "General",
            goal: goal || "Conversions",
            tone: tone || "Engaging",
            platform: platform || "All platforms",
            generatedContent,
          },
        });

        return jsonResponse({ success: true, campaign }, 201);
      }

      case "delete": {
        if (!id) return jsonResponse({ success: false, error: "id is required" }, 400);
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
          return jsonResponse({ success: false, error: "Invalid campaign ID." }, 400);
        }

        await prisma.campaign.delete({
          where: { id: parsedId },
        });

        return jsonResponse({ success: true, message: "Campaign deleted successfully." });
      }

      default:
        return jsonResponse({ success: false, error: `Unknown action: ${actionType}` }, 400);
    }
  } catch (error) {
    console.error("[app.api.campaigns] action error:", error);

    // Handle Prisma record not found error code
    if (error.code === "P2025") {
      return jsonResponse({ success: false, error: "Campaign not found." }, 404);
    }

    return jsonResponse({ success: false, error: error.message || "Failed to execute campaigns action." }, 500);
  }
}
