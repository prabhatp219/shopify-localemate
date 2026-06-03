import { useState } from "react";
import { Plus } from "lucide-react";

const PERIODS = [
  "Today",
  "Last 7 Days",
  "Last 30 Days",
  "Last 90 Days",
  "Custom",
];

export default function Header({
  onAddMarket,
  onPeriodChange,
  syncing,
  selectedPeriod,
}) {
  const [customDays, setCustomDays] = useState("");

  return (
    <header className="flex flex-col gap-4 px-7 pb-7 pt-8 lg:flex-row lg:items-start lg:justify-between">

      {/* LEFT */}
      <div>
        <h1 className="mt-1 text-3xl font-bold tracking-normal text-slate-950">
          Dashboard
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

        {/* PERIOD SELECT */}
        <select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          disabled={syncing}
          className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none"
        >
          {PERIODS.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>

        {/* CUSTOM DAYS INPUT */}
        {selectedPeriod === "Custom" && (
          <div className="flex items-center gap-2">

            <input
              type="number"
              placeholder="Enter days"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              className="h-11 w-36 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none"
            />

            <button
              onClick={() => {
                if (customDays && Number(customDays) > 0) {
                  onPeriodChange(Number(customDays));
                }
              }}
              className="h-11 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-black"
            >
              Apply
            </button>

          </div>
        )}

        {/* ADD MARKET BUTTON */}
        <button
          onClick={onAddMarket}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-black"
        >
          <Plus size={18} />
          Add market
        </button>

      </div>
    </header>
  );
}