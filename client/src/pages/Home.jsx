import { useEffect, useState } from "react";
import { Compass, MapPinned, Sparkles } from "lucide-react";
import TourForm from "../components/TourForm.jsx";
import ItineraryTimeline from "../components/ItineraryTimeline.jsx";
import BudgetSummary from "../components/BudgetSummary.jsx";
import { generateTour, getAreas } from "../services/tourService.js";

export default function Home() {
  const [areas, setAreas] = useState([]);
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    getAreas()
      .then(setAreas)
      .catch((error) => setPageError(error.message));
  }, []);

  async function handleGenerate(formData) {
    setLoading(true);
    setPageError("");
    setTour(null);
    try {
      const result = await generateTour(formData);
      setTour({ ...result, budget: formData.budget });
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-600 p-2 text-white"><Compass size={21} /></div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">TripGenie<span className="text-indigo-600">AI</span></span>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:flex">
            <MapPinned size={14} /> Explore Dhaka, smarter
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-6 py-9 text-white sm:px-10 sm:py-12">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">
              <Sparkles size={14} /> Your personal Dhaka day planner
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">A better day out in <span className="text-indigo-300">Dhaka.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">
              Tell us your areas, budget and interests. TripGenie arranges verified places into a practical day plan.
            </p>
          </div>
        </section>

        {pageError && (
          <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {pageError}
            <p className="mt-1 text-xs">Make sure the backend is running and check the terminal for details.</p>
          </div>
        )}

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
          <TourForm areas={areas} onGenerate={handleGenerate} loading={loading} />
          <div className="space-y-6">
            {loading && (
              <div className="rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                <p className="mt-4 font-semibold text-slate-800">Gemini is planning your tour...</p>
                <p className="mt-1 text-sm text-slate-500">Checking the selected area's verified places.</p>
              </div>
            )}
            {tour && (
              <>
                <BudgetSummary tour={tour} />
                <ItineraryTimeline tour={tour} />
              </>
            )}
            {!loading && !tour && (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600"><MapPinned size={30} /></div>
                <h2 className="mt-5 text-xl font-bold text-slate-900">Your itinerary will appear here</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Fill in the form and generate a tour. Add verified place records to the backend before your first request.</p>
              </div>
            )}
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-slate-400">TripGenie AI · Dhaka, Bangladesh · Estimated information only</p>
      </main>
    </div>
  );
}
