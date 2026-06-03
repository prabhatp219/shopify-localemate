import { useState, useEffect } from "react";
import { Filter, RefreshCw, Check, Plus, Trash2, RotateCw, X, Sparkles, ArrowUpRight } from "lucide-react";
import {
  getSuggestions,
  applySuggestion,
  reviewSuggestion,
  regenerateSuggestion,
  applyAllSuggestions,
  generateSuggestion,
  deleteSuggestion,
} from "../../../utils/api.js";

// Preset market list with flags for quick-add
const PRESET_MARKETS = [
  { name: "India", flag: "🇮🇳" },
  { name: "USA", flag: "🇺🇸" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "UK", flag: "🇬🇧" },
  { name: "France", flag: "🇫🇷" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Saudi Arabia", flag: "🇸🇦" },
  { name: "South Korea", flag: "🇰🇷" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "UAE", flag: "🇦🇪" },
  { name: "Indonesia", flag: "🇮🇩" },
  { name: "Nigeria", flag: "🇳🇬" },
  { name: "Turkey", flag: "🇹🇷" },
  { name: "Thailand", flag: "🇹🇭" },
  { name: "China", flag: "🇨🇳" },
];

const MARKET_TO_COUNTRY_CODE = {
  india: "IN",
  usa: "US",
  germany: "DE",
  japan: "JP",
  mena: "AE",
  uk: "GB",
  france: "FR",
  brazil: "BR",
  "saudi arabia": "SA",
  "south korea": "KR",
  australia: "AU",
  canada: "CA",
  mexico: "MX",
  italy: "IT",
  spain: "ES",
  uae: "AE",
  indonesia: "ID",
  nigeria: "NG",
  turkey: "TR",
  thailand: "TH",
  china: "CN"
};

function getMarketFlagUrl(marketName) {
  const code = MARKET_TO_COUNTRY_CODE[marketName.toLowerCase()] || "un";
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

// How many rows per page
const ROWS_PER_PAGE = 6;

export default function SuggestionsTable() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingAll, setApplyingAll] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Generate form state
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [genMarket, setGenMarket] = useState("");
  const [genHeadline, setGenHeadline] = useState("");
  const [genDetail, setGenDetail] = useState("");
  const [generating, setGenerating] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "applied" | "under_review"
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  }

  // ─── DATA FETCH ──────────────────────────────────────────────
  async function fetchSuggestions() {
    try {
      setLoading(true);
      const data = await getSuggestions();
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      showToast("Failed to load suggestions. Is the backend running?", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // ─── GENERATE NEW ────────────────────────────────────────────
  async function handleGenerate(market, headline, detail = "") {
    try {
      setGenerating(true);
      const data = await generateSuggestion(market, headline, detail);
      if (data.success) {
        // Prepend new suggestion to the top of the list
        setSuggestions((prev) => [data.suggestion, ...prev]);
        showToast(`AI suggestion generated for ${market}!`, "success");
        setGenMarket("");
        setGenHeadline("");
        setGenDetail("");
        setShowGenerateForm(false);
        setCurrentPage(1); // go to first page to see the new one
      } else {
        showToast(data.error || "Failed to generate.", "error");
      }
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to generate suggestion.", "error");
    } finally {
      setGenerating(false);
    }
  }

  // Quick-generate from preset market with default headline
  async function handleQuickGenerate(market) {
    await handleGenerate(market, "Best Deals Today", "Limited time offer");
  }

  // ─── ACTIONS ─────────────────────────────────────────────────
  async function handleRefresh() {
    try {
      setRefreshing(true);
      const updated = [];
      for (const s of suggestions) {
        try {
          const data = await regenerateSuggestion(s.id);
          updated.push(data.success ? data.suggestion : s);
        } catch {
          updated.push(s);
        }
      }
      setSuggestions(updated);
      showToast("All suggestions refreshed!", "success");
    } catch {
      showToast("Failed to refresh.", "error");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleApplyAll() {
    try {
      setApplyingAll(true);
      const data = await applyAllSuggestions();
      if (data.success) {
        setSuggestions((prev) =>
          prev.map((s) => (s.status === "pending" ? { ...s, status: "applied" } : s))
        );
        showToast(`${data.appliedCount} suggestions applied!`, "success");
      }
    } catch {
      showToast("Failed to apply all.", "error");
    } finally {
      setApplyingAll(false);
    }
  }

  async function handleApply(id) {
    try {
      setActionLoadingId(id);
      const data = await applySuggestion(id);
      if (data.success) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "applied" } : s))
        );
        showToast("Suggestion applied!", "success");
      }
    } catch {
      showToast("Failed to apply.", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReview(id) {
    try {
      setActionLoadingId(id);
      const data = await reviewSuggestion(id);
      if (data.success) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "under_review" } : s))
        );
        showToast("Marked for review.", "success");
      }
    } catch {
      showToast("Failed to review.", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRegenerateOne(id) {
    try {
      setActionLoadingId(id);
      const data = await regenerateSuggestion(id);
      if (data.success) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? data.suggestion : s))
        );
        showToast("Regenerated with fresh AI!", "success");
      }
    } catch {
      showToast("Failed to regenerate.", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(id) {
    try {
      setActionLoadingId(id);
      const data = await deleteSuggestion(id);
      if (data.success) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        showToast("Suggestion deleted.", "success");
      }
    } catch {
      showToast("Failed to delete.", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  // ─── FILTERING & PAGINATION ──────────────────────────────────
  const filtered = statusFilter === "all"
    ? suggestions
    : suggestions.filter((s) => s.status === statusFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ROWS_PER_PAGE;
  const pageItems = filtered.slice(startIdx, startIdx + ROWS_PER_PAGE);

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      {/* TOAST */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border transition-all ${
          toast.type === "success"
            ? "bg-slate-50 text-slate-800 border-slate-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-700">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Suggestions</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Powered by LocaleMate AI · {suggestions.length} total · {pendingCount} pending
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* + NEW MARKET BUTTON */}
          <button
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            className="bg-zinc-200 hover:bg-zinc-300 transition text-zinc-800 px-4 py-2 rounded-xl text-sm flex items-center gap-2 font-semibold"
          >
            <Plus size={16} />
            New Market
          </button>

          {/* FILTER */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="border border-gray-200 hover:bg-gray-50 transition px-4 py-2 rounded-xl text-sm flex items-center gap-2 font-medium text-gray-700"
            >
              <Filter size={16} />
              {statusFilter === "all" ? "Filter" : statusFilter.replace("_", " ")}
            </button>

            {/* Filter dropdown */}
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 min-w-[160px] py-1">
                {[
                  { label: "All", value: "all" },
                  { label: "Pending", value: "pending" },
                  { label: "Applied", value: "applied" },
                  { label: "Under Review", value: "under_review" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setCurrentPage(1);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                      statusFilter === opt.value ? "font-bold text-slate-900 bg-slate-50" : "text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* REFRESH */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || suggestions.length === 0}
            className="border border-gray-200 hover:bg-gray-50 transition px-4 py-2 rounded-xl text-sm flex items-center gap-2 font-medium text-gray-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {/* APPLY ALL */}
          <button
            onClick={handleApplyAll}
            disabled={applyingAll || pendingCount === 0}
           className="bg-zinc-800 hover:bg-zinc-700 transition text-white px-5 py-2 rounded-xl text-sm flex items-center gap-2 font-semibold disabled:opacity-50"
          >
            <Check size={16} />
            {applyingAll ? "Applying..." : "Apply All"}
          </button>
        </div>
      </div>

      {/* ─── GENERATE NEW MARKET FORM ─────────────────────────── */}
      {showGenerateForm && (
        <div className="px-6 py-5 border-b border-gray-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Generate AI Suggestion for a New Market</h3>
            <button
              onClick={() => setShowGenerateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick-add preset countries */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Add (click a country)</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_MARKETS.map((m) => (
                <button
                  key={m.name}
                  onClick={() => handleQuickGenerate(m.name)}
                  disabled={generating}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-350 transition flex items-center gap-1.5 font-medium text-gray-700 disabled:opacity-50"
                >
                  <span>{m.flag}</span>
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom market form */}
          <div className="border-t border-slate-200/60 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Or enter custom market details</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!genMarket || !genHeadline) {
                  showToast("Market and Headline are required.", "error");
                  return;
                }
                handleGenerate(genMarket, genHeadline, genDetail);
              }}
              className="grid grid-cols-1 md:grid-cols-4 gap-3"
            >
              <input
                type="text"
                placeholder="Market / Country *"
                value={genMarket}
                onChange={(e) => setGenMarket(e.target.value)}
                required
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent bg-white"
              />
              <input
                type="text"
                placeholder="Current Headline *"
                value={genHeadline}
                onChange={(e) => setGenHeadline(e.target.value)}
                required
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent bg-white"
              />
              <input
                type="text"
                placeholder="Detail (optional)"
                value={genDetail}
                onChange={(e) => setGenDetail(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent bg-white"
              />
              <button
                type="submit"
                disabled={generating}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    ✨ Generate
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── TABLE ──────────────────────────────────────────────── */}
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr className="text-sm text-gray-500">
            <th className="text-left px-6 py-4 font-medium">Market</th>
            <th className="text-left px-6 py-4 font-medium">Current Headline</th>
            <th className="text-left px-6 py-4 font-medium">AI Suggested Headline</th>
            <th className="text-left px-6 py-4 font-medium">Expected Lift</th>
            <th className="text-left px-6 py-4 font-medium">Confidence</th>
            <th className="text-left px-6 py-4 font-medium">Action</th>
          </tr>
        </thead>

        <tbody>
          {/* LOADING */}
          {loading && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading suggestions...
                </div>
              </td>
            </tr>
          )}

          {/* EMPTY */}
          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center">
                <div className="text-gray-400 text-sm">
                  {statusFilter !== "all"
                    ? `No ${statusFilter.replace("_", " ")} suggestions found.`
                    : "No suggestions yet. Click '+ New Market' above to generate your first AI suggestion!"
                  }
                </div>
                {statusFilter === "all" && (
                  <button
                    onClick={() => setShowGenerateForm(true)}
                    className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                  >
                    + Generate Your First Suggestion
                  </button>
                )}
              </td>
            </tr>
          )}

          {/* ROWS */}
          {!loading && pageItems.map((item) => (
            <tr
              key={item.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition"
            >
              {/* MARKET */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-150 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                    <img
                      src={getMarketFlagUrl(item.market)}
                      alt={item.market}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://flagcdn.com/w40/un.png";
                      }}
                    />
                  </div>
                  <span className="font-medium text-gray-900">{item.market}</span>
                </div>
              </td>

              {/* CURRENT HEADLINE */}
              <td className="px-6 py-5">
                <div className="font-medium text-gray-900">{item.currentHeadline}</div>
                {item.currentDetail && (
                  <div className="text-sm text-gray-400 mt-1">{item.currentDetail}</div>
                )}
              </td>

              {/* AI SUGGESTED */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900">
                    {item.suggestedHeadline}
                  </span>
                </div>
              </td>

              {/* EXPECTED LIFT */}
              <td className="px-6 py-5">
                <div className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <ArrowUpRight size={13} className="text-emerald-600" />
                  <span>+{item.expectedLift}%</span>
                </div>
              </td>

              {/* CONFIDENCE */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400"
                      style={{ width: `${item.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {item.confidence}%
                  </span>
                </div>
              </td>

              {/* ACTION */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-1.5">
                  {item.status === "applied" ? (
                    <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500">
                      Applied ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(item.id)}
                      disabled={actionLoadingId === item.id}
                      className="px-4 py-2 rounded-2xl text-sm font-semibold transition bg-zinc-200 text-zinc-800 hover:bg-zinc-300 disabled:opacity-50"
                    >
                      {actionLoadingId === item.id ? "..." : "Apply"}
                    </button>
                  )}

                  {item.status === "pending" && (
                    <button
                      onClick={() => handleReview(item.id)}
                      disabled={actionLoadingId === item.id}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Review
                    </button>
                  )}

                  {/* Regenerate single */}
                  <button
                    onClick={() => handleRegenerateOne(item.id)}
                    disabled={actionLoadingId === item.id}
                    title="Regenerate AI"
                    className="p-2 rounded-lg text-gray-400 hover:text-slate-900 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    <RotateCw size={14} className={actionLoadingId === item.id ? "animate-spin" : ""} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={actionLoadingId === item.id}
                    title="Delete"
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── PAGINATION FOOTER ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-400 border-t border-gray-100">
        <p>
          Showing {pageItems.length} of {filtered.length} suggestions
          {statusFilter !== "all" && ` (${statusFilter.replace("_", " ")})`}
        </p>

        <div className="flex items-center gap-2">
          {/* PREVIOUS */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>

          {/* PAGE NUMBERS */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg font-medium transition ${
                page === safePage
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}

          {/* NEXT */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      </div>

    </div>
  );
}