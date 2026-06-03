import axios from "axios";
import prisma from "../db.server";
import CampaignGenerator from "../components/dashboard/CampaignGenerator";

export async function action({ request }) {
  try {
    const body = await request.json();

    const prompt = `
Generate a high-converting ecommerce marketing campaign.

Campaign Type:
${body.title}

Target Market:
${body.market}

Description:
${body.description}

Include:
1. Campaign headline
2. Promotional message
3. CTA
4. Instagram campaign idea
5. Email subject line

Make it modern and engaging.
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedContent =
      response.data.choices[0].message.content;

    const savedCampaign =
      await prisma.generatedCampaign.create({
        data: {
          template: body.title,
          title: body.title,
          market: body.market,
          content: generatedContent,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        campaign: savedCampaign,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("AI Generation Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "AI generation failed",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export default function CampaignsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <CampaignGenerator />
    </div>
  );
}