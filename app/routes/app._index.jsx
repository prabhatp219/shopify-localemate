import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import Header from "../components/Header";
import MarketsGrid from "../components/dashboard/MarketsGrid";

/**
 * Preset countries available for the "Add Market" modal.
 */
const AVAILABLE_MARKETS = [
  {
    country: "India",
    countryCode: "IN",
    region: "South Asia",
    flag: "🇮🇳",
    currency: "INR",
    language: "hi",
  },
  {
    country: "USA",
    countryCode: "US",
    region: "North America",
    flag: "🇺🇸",
    currency: "USD",
    language: "en",
  },
  {
    country: "Germany",
    countryCode: "DE",
    region: "Europe",
    flag: "🇩🇪",
    currency: "EUR",
    language: "de",
  },
  {
    country: "Japan",
    countryCode: "JP",
    region: "East Asia",
    flag: "🇯🇵",
    currency: "JPY",
    language: "ja",
  },
  {
    country: "UK",
    countryCode: "GB",
    region: "Europe",
    flag: "🇬🇧",
    currency: "GBP",
    language: "en",
  },
  {
    country: "France",
    countryCode: "FR",
    region: "Europe",
    flag: "🇫🇷",
    currency: "EUR",
    language: "fr",
  },
  {
    country: "Brazil",
    countryCode: "BR",
    region: "South America",
    flag: "🇧🇷",
    currency: "BRL",
    language: "pt",
  },
  {
    country: "Saudi Arabia",
    countryCode: "SA",
    region: "Middle East",
    flag: "🇸🇦",
    currency: "SAR",
    language: "ar",
  },
  {
    country: "South Korea",
    countryCode: "KR",
    region: "East Asia",
    flag: "🇰🇷",
    currency: "KRW",
    language: "ko",
  },
  {
    country: "Australia",
    countryCode: "AU",
    region: "Oceania",
    flag: "🇦🇺",
    currency: "AUD",
    language: "en",
  },
  {
    country: "Canada",
    countryCode: "CA",
    region: "North America",
    flag: "🇨🇦",
    currency: "CAD",
    language: "en",
  },
  {
    country: "UAE",
    countryCode: "AE",
    region: "Middle East",
    flag: "🇦🇪",
    currency: "AED",
    language: "ar",
  },
  {
    country: "Mexico",
    countryCode: "MX",
    region: "North America",
    flag: "🇲🇽",
    currency: "MXN",
    language: "es",
  },
  {
    country: "Italy",
    countryCode: "IT",
    region: "Europe",
    flag: "🇮🇹",
    currency: "EUR",
    language: "it",
  },
  {
    country: "Spain",
    countryCode: "ES",
    region: "Europe",
    flag: "🇪🇸",
    currency: "EUR",
    language: "es",
  },
  {
    country: "Indonesia",
    countryCode: "ID",
    region: "Southeast Asia",
    flag: "🇮🇩",
    currency: "IDR",
    language: "id",
  },
  {
    country: "Turkey",
    countryCode: "TR",
    region: "Middle East",
    flag: "🇹🇷",
    currency: "TRY",
    language: "tr",
  },
  {
    country: "Thailand",
    countryCode: "TH",
    region: "Southeast Asia",
    flag: "🇹🇭",
    currency: "THB",
    language: "th",
  },
  {
    country: "Nigeria",
    countryCode: "NG",
    region: "Africa",
    flag: "🇳🇬",
    currency: "NGN",
    language: "en",
  },
  {
    country: "China",
    countryCode: "CN",
    region: "East Asia",
    flag: "🇨🇳",
    currency: "CNY",
    language: "zh",
  },
];

/**
 * Default seed markets created when a shop has no markets yet.
 */
const DEFAULT_SEED_MARKETS = [
  {
    country: "India",
    countryCode: "IN",
    region: "South Asia",
    flag: "🇮🇳",
    currency: "INR",
    language: "hi",
    visitors: 194500,
    orders: 5976,
    revenue: 2487500,
    conversionRate: 4.8,
    localizationScore: 88,
    translatedItems: 812,
    trend: 0.6,
    isActive: true,
  },
  {
    country: "USA",
    countryCode: "US",
    region: "North America",
    flag: "🇺🇸",
    currency: "USD",
    language: "en",
    visitors: 210340,
    orders: 11779,
    revenue: 5890000,
    conversionRate: 5.6,
    localizationScore: 91,
    translatedItems: 1045,
    trend: 1.1,
    isActive: true,
  },
  {
    country: "Germany",
    countryCode: "DE",
    region: "Europe",
    flag: "🇩🇪",
    currency: "EUR",
    language: "de",
    visitors: 89210,
    orders: 2855,
    revenue: 1124000,
    conversionRate: 3.2,
    localizationScore: 76,
    translatedItems: 540,
    trend: 0.3,
    isActive: true,
  },
  {
    country: "Japan",
    countryCode: "JP",
    region: "East Asia",
    flag: "🇯🇵",
    currency: "JPY",
    language: "ja",
    visitors: 67890,
    orders: 2784,
    revenue: 892000,
    conversionRate: 4.1,
    localizationScore: 82,
    translatedItems: 450,
    trend: 0.4,
    isActive: true,
  },
];

/**
 * Calculates aggregate stats from a list of market records.
 * @param {Array} markets - Array of Market model objects
 * @returns {{ totalScore: number, activeMarkets: number, avgConversionLift: number, totalTranslated: number }}
 */
function calculateStats(markets) {
  if (markets.length === 0) {
    return {
      totalScore: 0,
      activeMarkets: 0,
      avgConversionLift: 0,
      totalTranslated: 0,
    };
  }

  /**
   * Total visitors across all markets
   */
  const totalVisitors = markets.reduce(
    (sum, m) => sum + (m.visitors || 0),
    0
  );

  /**
   * Dynamic weighted score
   * Reacts to:
   * - localization score
   * - conversion rate
   * - trend
   */
  const weightedScore =
    totalVisitors > 0
      ? markets.reduce((sum, m) => {

          /**
           * Performance boost
           */
          const performanceBoost =
            (m.conversionRate || 0) * 2 +
            (m.trend || 0) * 3;

          /**
           * Dynamic score
           */
          const dynamicScore =
            (m.localizationScore || 0) +
            performanceBoost;

          return (
            sum +
            dynamicScore * (m.visitors || 0)
          );
        }, 0) / totalVisitors
      : 0;

  /**
   * Clamp between 0–100
   */
  const finalScore = Math.max(
    0,
    Math.min(100, weightedScore)
  );

  /**
   * Avg trend
   */
  const avgTrend =
    markets.reduce(
      (sum, m) => sum + (m.trend || 0),
      0
    ) / markets.length;

  /**
   * Total translated items
   */
  const totalTranslated = markets.reduce(
    (sum, m) => sum + (m.translatedItems || 0),
    0
  );

  return {
    totalScore:
      Math.round(finalScore * 10) / 10,

    activeMarkets: markets.length,

    avgConversionLift:
      Math.round(avgTrend * 10) / 10,

    totalTranslated,
  };
}

/**
 * Loader: authenticates, fetches markets from DB, seeds defaults if empty, calculates stats.
 * @param {{ request: Request }} args
 * @returns {Promise<{ markets: Array, stats: object }>}
 */
export async function loader({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    let markets = await prisma.market.findMany({
      where: { shop, isActive: true },
      orderBy: { localizationScore: "desc" },
    });

    const stats = calculateStats(markets);

    return { markets, stats };
  } catch (error) {
    console.error("[Dashboard Loader] Error:", error);
    return {
      markets: [],
      stats: {
        totalScore: 0,
        activeMarkets: 0,
        avgConversionLift: 0,
        totalTranslated: 0,
      },
    };
  }
}

/**
 * Action: handles "addMarket" intent — creates a new Market record in the DB.
 * @param {{ request: Request }} args
 * @returns {Promise<{ ok: boolean, market?: object, error?: string }>}
 */
export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "addMarket") {
      const countryCode = formData.get("countryCode");
      const preset = AVAILABLE_MARKETS.find(
        (m) => m.countryCode === countryCode,
      );

      if (!preset) {
        return { ok: false, error: "Unknown country code" };
      }

      // Prevent duplicates
      const existing = await prisma.market.findUnique({
        where: { shop_countryCode: { shop: session.shop, countryCode } },
      });

      if (existing) {
        return { ok: false, error: `${preset.country} market already exists` };
      }

      const market = await prisma.market.create({
        data: {
          shop: session.shop,
          country: preset.country,
          countryCode: preset.countryCode,
          region: preset.region,
          flag: preset.flag,
          currency: preset.currency,
          language: preset.language,
          visitors: 0,
          orders: 0,
          revenue: 0,
          conversionRate: 0,
          localizationScore: 0,
          translatedItems: 0,
          trend: 0,
          isActive: true,
        },
      });

      return { ok: true, market };
    }

    return { ok: false, error: "Unknown intent" };
  } catch (error) {
    console.error("[Dashboard Action] Error:", error);
    return { ok: false, error: error.message };
  }
}

/**
 * Computes the SVG gauge needle endpoint from a score (0–100).
 * The arc spans from 180° (left) to 0° (right), so score 0 → 180° and score 100 → 0°.
 * @param {number} score - 0 to 100
 * @returns {{ x2: number, y2: number }}
 */
function getNeedleEnd(score) {
  const clampedScore = Math.max(0, Math.min(100, score));
  // Map 0→π (180°) down to 100→0 (0°)
  const angleRad = Math.PI * (1 - clampedScore / 100);
  const cx = 100;
  const cy = 100;
  const needleLength = 55;
  const x2 = cx + needleLength * Math.cos(angleRad);
  const y2 = cy - needleLength * Math.sin(angleRad);
  return { x2: Math.round(x2), y2: Math.round(y2) };
}

/**
 * Calculates the stroke-dashoffset for the SVG gauge arc based on score.
 * Arc total length ≈ 251 (half-circle of radius 80). 0 score → fully hidden (251), 100 → fully shown (0).
 * @param {number} score - 0 to 100
 * @returns {number}
 */
function getGaugeDashoffset(score) {
  const arcLength = 251;
  const clampedScore = Math.max(0, Math.min(100, score));
  return Math.round(arcLength * (1 - clampedScore / 100));
}

export default function Dashboard() {
  const { markets, stats } = useLoaderData();
  const fetcher = useFetcher();
  const syncFetcher = useFetcher();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [addError, setAddError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("Last 30 Days");

  const isSyncing = syncFetcher.state !== "idle";
  const isAdding = fetcher.state !== "idle";

  // Determine which countries are already added
  const existingCodes = new Set(markets.map((m) => m.countryCode));
  const availableToAdd = AVAILABLE_MARKETS.filter(
    (m) => !existingCodes.has(m.countryCode),
  );

  const needleEnd = getNeedleEnd(stats.totalScore);
  const dashOffset = getGaugeDashoffset(stats.totalScore);

  /**
   * Handles the Add Market form submission.
   */
  function handleAddMarket() {
    if (!selectedCountry) return;
    setAddError("");

    fetcher.submit(
      { intent: "addMarket", countryCode: selectedCountry },
      { method: "post" },
    );

    setSelectedCountry("");
    setShowAddModal(false);
  }

  /**
   * Triggers a sync POST to /app/api/sync.
   */
  function handleSync(period) {
    setSelectedPeriod(period);

    let days = 30;

    if (period === "Today") days = 1;
    if (period === "Last 7 Days") days = 7;
    if (period === "Last 30 Days") days = 30;
    if (period === "Last 90 Days") days = 90;

    syncFetcher.submit(
      { days },
      {
        method: "post",
        action: "/app/api/sync",
      },
    );
  }

  async function handleDeleteMarket(id) {
    try {
      const response = await fetch("/app/api/markets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error || "Failed to remove market");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  }

  // Show error from action response
  const actionData = fetcher.data;
  const actionError = actionData && !actionData.ok ? actionData.error : null;

  return (
    <div className="min-h-screen bg-gray-100 px-6">
      <div className="flex-1 h-screen overflow-y-auto px-6 py-0">
        <Header
          onAddMarket={() => setShowAddModal(true)}
          onPeriodChange={handleSync}
          syncing={isSyncing}
          selectedPeriod={selectedPeriod}
        />

        {/* ─── Hero Banner ─── */}
        <div className="bg-gradient-to-r from-indigo-950 to-purple-800 border border-slate-800/40 text-white px-10 py-4 rounded-2xl mt-4 shadow-xl flex justify-between items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              🌐
              <p>Localized Experience Score</p>
            </div>

            <h1 className="text-7xl font-bold tracking-tight mt-2 flex items-baseline gap-1">
              {stats.totalScore}
              <span className="text-2xl font-semibold text-slate-500">%</span>
            </h1>

            <div className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 mt-3">
              ↗ +{stats.avgConversionLift}% vs last month
            </div>

            <p className="text-slate-500 mt-3 text-xs">
              Based on {stats.activeMarkets} active market
              {stats.activeMarkets !== 1 ? "s" : ""} · Updated just now
            </p>
          </div>

          {/* ─── SVG Gauge ─── */}
          <div className="flex flex-col items-center flex-1">
            <div className="relative w-44 h-24">
              <svg viewBox="0 0 200 120" className="w-full h-full">
                {/* 50 Marker */}
                <text x="100" y="10" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">50</text>
                
                {/* Background arc */}
                <path
                  d="M20 100 A80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#23242f"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Colored arc — driven by score */}
                <path
                  d="M20 100 A80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: "stroke-dashoffset 0.8s ease",
                  }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="45%" stopColor="#f59e0b" />
                    <stop offset="75%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                </defs>
                {/* Needle */}
                <line
                  x1="100"
                  y1="100"
                  x2={needleEnd.x2}
                  y2={needleEnd.y2}
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    transition: "all 0.8s ease",
                  }}
                />
                <circle cx="100" cy="100" r="6" fill="white" />
              </svg>
            </div>

            <div className="flex gap-3.5 text-xs text-slate-400 mt-1 font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#ef4444] rounded-full"></div>
                Low
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full"></div>
                Medium
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></div>
                High
              </div>
            </div>
          </div>

          {/* ─── Stats Column ─── */}
          <div className="text-right space-y-3 flex-1">
            <div>
              <p className="text-slate-400 text-xs font-medium">Active Markets</p>
              <h2 className="text-3xl font-bold mt-0.5 text-white">
                {stats.activeMarkets}
              </h2>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">Avg Conversion Lift</p>
              <h2 className="text-3xl font-bold text-emerald-400 mt-0.5">
                +{stats.avgConversionLift}%
              </h2>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">Content Translated</p>
              <h2 className="text-3xl font-bold mt-0.5 text-white">
                {stats.totalTranslated.toLocaleString()} items
              </h2>
            </div>
          </div>
        </div>

        {/* ─── Markets Grid ─── */}
        {/* <MarketsGrid markets={markets} /> */}
        <MarketsGrid markets={markets} onDeleteMarket={handleDeleteMarket} />

        {/* ─── Action Error Toast ─── */}
        {actionError && (
          <div className="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
            {actionError}
          </div>
        )}

        {/* ─── Add Market Modal ─── */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-600">Add Market</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5">
                {availableToAdd.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    All available markets have already been added.
                  </p>
                ) : (
                  <>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select a country
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {availableToAdd.map((m) => (
                        <button
                          key={m.countryCode}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(m.countryCode);
                            setAddError("");
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-sm transition ${
                            selectedCountry === m.countryCode
                              ? "border-teal-500 bg-teal-50 ring-2 ring-teal-200"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-xl">{m.flag}</span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {m.country}
                            </p>
                            <p className="text-xs text-gray-400">{m.region}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {addError && (
                  <p className="mt-3 text-sm text-red-600">{addError}</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError("");
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMarket}
                  disabled={
                    !selectedCountry || isAdding || availableToAdd.length === 0
                  }
                  className="px-5 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg shadow-sm hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? "Adding..." : "Add Market"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
