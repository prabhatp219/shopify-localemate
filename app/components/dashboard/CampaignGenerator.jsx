import { useState } from "react";
import { generateCampaign as apiGenerateCampaign } from "../../../utils/api.js";
import { campaigns } from "./dashboardData";
import CampaignResult from "./CampaignResult";

export default function CampaignGenerator() {

  // loadingKey = the TITLE of the card currently loading, or null
  const [loadingKey, setLoadingKey] = useState(null);
  const [generatedContent, setGeneratedContent] = useState("");

  // Custom form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [title, setTitle] = useState("");
  const [market, setMarket] = useState("");
  const [productType, setProductType] = useState("");
  const [goal, setGoal] = useState("Sales/Conversions");
  const [tone, setTone] = useState("Engaging");
  const [platform, setPlatform] = useState("Instagram");

  // Stores last used payload + key for Regenerate button
  const [lastPayload, setLastPayload] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [copied, setCopied] = useState(false);

  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  }

  // key = unique string per card e.g. "Diwali Campaign" or "custom"
  async function generateCampaign(payload, key) {
    try {
      setLoadingKey(key);        // mark ONLY this card as loading
      setGeneratedContent("");
      setLastPayload({ payload, key });

      const data = await apiGenerateCampaign(payload);

      if (data.success) {
        setGeneratedContent(data.campaign.generatedContent);
        showToast("Campaign generated and saved successfully!", "success");
      } else {
        showToast(data.error || "Failed to generate campaign.", "error");
      }
    } catch (error) {
      console.error(error);
      const errMsg =
        error.response?.data?.error ||
        "Backend not reachable. Run: node server.js";
      showToast(errMsg, "error");
    } finally {
      setLoadingKey(null);       // clear — all buttons reset to normal
    }
  }

  function copyToClipboard() {
    if (!generatedContent) return;
    navigator.clipboard
      .writeText(generatedContent)
      .then(() => {
        setCopied(true);
        showToast("Copied to clipboard!", "success");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => showToast("Failed to copy.", "error"));
  }

  function handleRegenerate() {
    if (lastPayload) {
      generateCampaign(lastPayload.payload, lastPayload.key);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

      {/* TOAST */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border-green-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Regional Campaign Generator
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                AI-powered campaigns tailored for local culture &amp; timing
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
          ⚡ AI-Powered
        </div>
      </div>

      {/* PRESET CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
        {campaigns.map((campaign, index) => {
          // Is THIS specific card the one loading right now?
          const thisCardIsLoading = loadingKey === campaign.title;
          // Is any card loading? (to disable all buttons while one runs)
          const anyLoading = loadingKey !== null;

          return (
            <div
              key={index}
              className={`border-2 ${campaign.border} rounded-2xl p-6 text-center bg-white`}
            >
              <div className="text-4xl">{campaign.icon}</div>

              <h3 className="font-bold text-xl mt-4 text-gray-900">
                {campaign.title}
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                {campaign.market} · {campaign.dates}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {campaign.description}
              </p>

              <button
                onClick={() => {
                  // Block if anything is already loading
                  if (loadingKey !== null) return;

                  let campaignTone = "Festive & Joyful";
                  let campaignPlatform = "Instagram & Email";

                  if (campaign.title.includes("Black Friday")) {
                    campaignTone = "Urgent (FOMO)";
                    campaignPlatform = "All platforms";
                  } else if (campaign.title.includes("Ramadan")) {
                    campaignTone = "Friendly";
                    campaignPlatform = "Facebook & Instagram";
                  }

                  generateCampaign(
                    {
                      title: campaign.title,
                      market: campaign.market,
                      productType: "General E-commerce",
                      goal: "Sales & Conversions",
                      tone: campaignTone,
                      platform: campaignPlatform,
                    },
                    campaign.title
                  );
                }}
                className={`mt-5 ${campaign.button} transition text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm
                  ${thisCardIsLoading ? "opacity-70 cursor-not-allowed" : ""}
                  ${!thisCardIsLoading && loadingKey !== null ? "pointer-events-none" : ""}
                `}
              >
                {thisCardIsLoading ? "Generating..." : "✨ Generate"}
              </button>
            </div>
          );
        })}

        {/* CUSTOM CARD */}
        <div className="border-2 border-gray-300 rounded-2xl p-6 text-center bg-gray-50">
          <div className="text-4xl text-gray-400">⊕</div>
          <h3 className="font-bold text-xl mt-4 text-gray-900">Custom Campaign</h3>
          <p className="text-sm text-gray-500 mt-2">Any Market</p>
          <p className="text-xs text-gray-400 mt-1">Your own brief</p>
          <button
            onClick={() => {
              if (loadingKey !== null) return;
              setShowCustomForm(true);
            }}
            className={`mt-5 border border-gray-300 bg-white hover:bg-gray-100 transition text-gray-700 px-6 py-2.5 rounded-xl font-semibold shadow-sm
              ${loadingKey !== null ? "pointer-events-none" : ""}
            `}
          >
            ✨ Create Custom
          </button>
        </div>
      </div>

      {/* CUSTOM FORM */}
      {showCustomForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title || !market) {
              showToast("Campaign Title and Target Market are required.", "error");
              return;
            }
            generateCampaign(
              { title, market, productType, goal, tone, platform },
              "custom"
            );
          }}
          className="mt-6 border border-gray-200 rounded-2xl p-6 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-bold text-gray-900">Create Custom Campaign</h3>
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Campaign Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Summer Clearance Sale"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Target Market *
              </label>
              <input
                type="text"
                placeholder="e.g. USA, Germany, Japan"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Product Type
              </label>
              <input
                type="text"
                placeholder="e.g. Leather Shoes, Organic Cosmetics"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Campaign Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="Sales/Conversions">Sales &amp; Conversions</option>
                <option value="Brand Awareness">Brand Awareness</option>
                <option value="Lead Generation">Lead Generation</option>
                <option value="Traffic Increase">Traffic Increase</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Tone of Voice
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="Engaging">Engaging &amp; Friendly</option>
                <option value="Professional">Professional</option>
                <option value="Urgent">Urgent (FOMO)</option>
                <option value="Funny">Funny &amp; Witty</option>
                <option value="Informative">Informative</option>
                <option value="Festive/Joyful">Festive &amp; Joyful</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Marketing Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Google Ads">Google Ads</option>
                <option value="TikTok">TikTok</option>
                <option value="Email Newsletter">Email Newsletter</option>
                <option value="All platforms">All (Cross-Channel)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingKey !== null}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              {loadingKey === "custom" ? "Generating Campaign..." : "✨ Generate Campaign"}
            </button>
          </div>
        </form>
      )}

      {/* GENERATED RESULT — Beautiful parsed UI */}
      {(generatedContent || loadingKey !== null) && (
        <CampaignResult
          content={generatedContent}
          onRegenerate={handleRegenerate}
          isRegenerating={loadingKey !== null}
          campaignTitle={lastPayload?.payload?.title || "Campaign"}
        />
      )}

      {/* FOOTER */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mt-6 pt-4 border-t border-gray-100">
        <span>ⓘ</span>
        <p>
          Campaigns are generated using local cultural insights, peak sales windows, and your store&apos;s historical performance data.
        </p>
      </div>
    </div>
  );
}