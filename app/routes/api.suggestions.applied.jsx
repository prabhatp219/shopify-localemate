import prisma from "../db.server";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function loader() {
  try {
    const suggestions = await prisma.suggestion.findMany({
      where: { status: "applied" },
    });
    return jsonResponse({ success: true, suggestions });
  } catch (error) {
    console.error("[api.suggestions.applied] loader error:", error);
    return jsonResponse(
      { success: false, error: "Failed to fetch applied suggestions." },
      500
    );
  }
}

export async function action() {
  return jsonResponse({ success: false, error: "Method not allowed" }, 405);
}
