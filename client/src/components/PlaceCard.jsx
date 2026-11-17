
import {
    Clock3,
    MapPin,
    Wallet,
    Lightbulb,
    Info
} from "lucide-react";

export default function PlaceCard({ stop, index }) {
    const hasKnownCost =
        stop.estimatedCost !== null &&
        stop.estimatedCost !== undefined &&
        Number.isFinite(Number(stop.estimatedCost));

    // Only label a place as free when the dataset explicitly says "free"
    const isFree = stop.costType === "free";

    return (
        <article className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            {/* Place name and stop number */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                        Stop {index + 1}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                        {stop.place}
                    </h3>

                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <MapPin size={14} />
                        {stop.area}
                    </p>
                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                    {stop.time}
                </span>
            </div>

            {/* Cost and opening hours */}
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">

                {/* Cost information */}
                <div className="flex items-start gap-2">
                    <Wallet size={15} className="mt-0.5 shrink-0" />

                    <div>
                        {hasKnownCost ? (
                            <p className="font-medium">
                                {isFree
                                    ? "Free · ৳0"
                                    : `Estimated: ৳${Number(
                                        stop.estimatedCost
                                    ).toLocaleString("en-BD")}`}
                            </p>
                        ) : (
                            <p className="font-medium text-amber-700">
                                <span className="inline-flex items-center gap-1">
                                    <Info size={14} />
                                    Cost unavailable
                                </span>
                            </p>
                        )}

                        {stop.costNote && (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                {stop.costNote}
                            </p>
                        )}
                    </div>
                </div>

                {/* Opening hours */}
                <p className="flex items-start gap-2">
                    <Clock3 size={15} className="mt-0.5 shrink-0" />

                    <span>
                        {stop.openingHours || "Opening hours unavailable"}
                    </span>
                </p>
            </div>

            {/* AI generated reason */}
            {stop.reason && (
                <p className="mt-4 text-sm leading-6 text-slate-700">
                    {stop.reason}
                </p>
            )}

            {/* AI generated tip */}
            {stop.tip && (
                <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-900">
                    <Lightbulb size={16} className="mt-0.5 shrink-0" />
                    <span>{stop.tip}</span>
                </p>
            )}

        </article>
    );
}
