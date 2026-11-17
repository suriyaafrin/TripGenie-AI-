import PlaceCard from "./PlaceCard.jsx";
import { Route } from "lucide-react";

export default function ItineraryTimeline({ tour }) {
  if (!tour.stops?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-semibold text-slate-800">No itinerary stops were returned.</p>
        <p className="mt-1 text-sm text-slate-500">Check that your selected area has verified place records.</p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-5 rounded-2xl bg-indigo-950 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-indigo-200">Your AI itinerary</p>
        <p className="mt-2 leading-7 text-indigo-50">{tour.summary}</p>
      </div>
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Route size={16} /> Stops are grouped by area. Allow the configured travel buffer when changing areas.
      </div>
      <div className="space-y-4">
        {tour.stops.map((stop, index) => <PlaceCard key={stop.placeId} stop={stop} index={index} />)}
      </div>
    </section>
  );
}
