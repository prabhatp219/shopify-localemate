
/**
 * Maps country codes to background color classes for the flag avatar.
 */
const BG_COLOR_MAP = {
  IN: "bg-orange-50",
  US: "bg-blue-50",
  DE: "bg-yellow-50",
  JP: "bg-pink-50",
  GB: "bg-indigo-50",
  FR: "bg-sky-50",
  BR: "bg-green-50",
  SA: "bg-emerald-50",
  KR: "bg-rose-50",
  AU: "bg-cyan-50",
  CA: "bg-red-50",
  AE: "bg-teal-50",
  MX: "bg-lime-50",
  IT: "bg-amber-50",
  ES: "bg-orange-50",
  ID: "bg-fuchsia-50",
  TR: "bg-red-50",
  TH: "bg-violet-50",
  NG: "bg-green-50",
  CN: "bg-rose-50",
};

/**
 * Returns Tailwind classes for the score badge based on score value.
 * @param {number} score
 * @returns {string}
 */
function getScoreBadgeClasses(score) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700";
  if (score >= 60) return "bg-indigo-50 text-indigo-700";
  return "bg-slate-100 text-slate-700";
}

/**
 * Returns the Tailwind bg class for the progress bar.
 * @param {number} score
 * @returns {string}
 */
function getProgressBarColor(score) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-indigo-500";
  return "bg-slate-400";
}

/**
 * Formats a number using Indian/locale-aware formatting.
 * @param {number} value
 * @returns {string}
 */
function formatVisitors(value) {
  if (typeof value !== "number") return String(value);
  return value.toLocaleString("en-IN");
}

/**
 * A single market card displaying flag, region, score, visitors, conversion rate, and trend.
 * @param {{ market: object }} props - market matches the Market Prisma model shape
 */
// export default function MarketCard({ market }) {
export default function MarketCard({ market, onDelete }) {
  const bgColor = BG_COLOR_MAP[market.countryCode] || "bg-gray-50";
  const scoreBadge = getScoreBadgeClasses(market.localizationScore);
  const progressColor = getProgressBarColor(market.localizationScore);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition duration-200">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-8 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-50">
            <img
              src={`https://flagcdn.com/w80/${market.countryCode.toLowerCase()}.png`}
              alt={`${market.country} flag`}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h3 className="font-bold text-base text-gray-900 leading-tight">
              {market.country}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{market.region}</p>
          </div>
        </div>

        <div className={`${scoreBadge} text-xs font-bold px-2.5 py-1 rounded-full`}>
          {market.localizationScore}%
        </div>
      </div>

      {/* STATS */}
      <div className="mt-6 space-y-3.5 text-sm">
        <div className="flex justify-between">
          <div className="text-gray-500 font-medium">
            Visitors
          </div>
          <p className="font-semibold text-gray-900">
            {formatVisitors(market.visitors)}
          </p>
        </div>

        <div className="flex justify-between">
          <div className="text-gray-500 font-medium">
            Conv. Rate
          </div>
          <p className="font-semibold text-gray-900">
            {market.conversionRate}%
          </p>
        </div>

        <div className="flex justify-between">
          <div className="text-gray-500 font-medium">
            Loc. Score
          </div>
          <p className="font-semibold text-gray-900">
            {market.localizationScore}/100
          </p>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="mt-5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${progressColor}`}
          style={{ width: `${market.localizationScore}%` }}
        ></div>
      </div>

      {/* FOOTER BUTTONS */}
      <div className="mt-5 flex items-center justify-end">
        <button
          onClick={() => {
            const confirmed = window.confirm(
              `Remove ${market.country} market?`,
            );
            if (confirmed) {
              onDelete(market.id);
            }
          }}
          className="text-xs text-red-500 font-semibold hover:text-red-700 transition duration-150"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
