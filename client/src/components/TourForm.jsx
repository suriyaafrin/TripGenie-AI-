import { useState } from "react";
import { Sparkles, MapPin, Wallet, Clock3 } from "lucide-react";

const INTEREST_OPTIONS = [
  { value: "food", label: "Food" },
  { value: "park", label: "Parks & nature" },
  { value: "shopping", label: "Shopping" },
  { value: "culture", label: "Culture & history" },
  { value: "snacks", label: "Snacks" }
];

export default function TourForm({ areas, onGenerate, loading }) {
  const [selectedAreas, setSelectedAreas] = useState(["Dhanmondi"]);
  const [budget, setBudget] = useState("1500");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("20:00");
  const [interests, setInterests] = useState(["food", "park"]);
  const [note, setNote] = useState("");

  function toggleArea(area) {
    setSelectedAreas((current) =>
      current.includes(area)
        ? current.filter((item) => item !== area)
        : [...current, area]
    );
  }

  function toggleInterest(value) {
    setInterests((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    onGenerate({
      areas: selectedAreas,
      budget: Number(budget),
      startTime,
      endTime,
      interests,
      note
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-indigo-600">Build your day</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Where do you want to go?</h2>
        <p className="mt-1 text-sm text-slate-500">Choose up to two areas for a more relaxed Dhaka trip.</p>
      </div>

      <div className="space-y-5">
        <section>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin size={16} /> Select area(s)
          </label>
          {areas.length === 0 ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No area data found. Add an area JSON file in the server data folder.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => {
                const active = selectedAreas.includes(area);
                const disabled = !active && selectedAreas.length >= 2;
                return (
                  <button
                    key={area}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleArea(area)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          )}
          {selectedAreas.length > 2 && <p className="mt-2 text-sm text-rose-600">Please choose no more than two areas.</p>}
        </section>

        <section>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Wallet size={16} /> Total budget (BDT)
          </label>
          <input type="number" min="1" required value={budget} onChange={(e) => setBudget(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </section>

        <section>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Clock3 size={16} /> Your available time
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-1 block text-xs text-slate-500">Start</span>
              <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <span className="mb-1 block text-xs text-slate-500">End</span>
              <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-500" />
            </div>
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-700">What are you interested in?</p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((option) => {
              const active = interests.includes(option.value);
              return (
                <button key={option.value} type="button" onClick={() => toggleInterest(option.value)}
                  className={`rounded-full border px-3 py-2 text-sm transition ${active ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {active ? "✓ " : "+ "}{option.label}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Any special request? <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea rows="3" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Example: lake-er pashe shanto jayga ar sosta khabar chai"
            className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </section>

        {selectedAreas.length > 1 && (
          <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
            Area change-er jonno plan-e 45-minute travel buffer dhora hobe.
          </p>
        )}
        <button type="submit" disabled={loading || selectedAreas.length === 0 || selectedAreas.length > 2}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          <Sparkles size={18} /> {loading ? "Planning your tour..." : "Generate my tour"}
        </button>
      </div>
    </form>
  );
}
