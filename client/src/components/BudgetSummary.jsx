
import { Wallet, BadgeCheck, AlertTriangle, Info } from "lucide-react";

export default function BudgetSummary({ tour }) {
    const budget = Number(tour.budget || 0);
    const total = Number(tour.totalEstimatedCost || 0);
    const remaining = budget - total;

    const hasUnknownCosts = Boolean(tour.hasUnknownCosts);
    const isOverBudget = total > budget;

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800">
                <Wallet size={18} />
                <h3 className="font-bold">Budget summary</h3>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Your budget</p>
                    <p className="mt-1 text-xl font-bold">
                        ৳{budget.toLocaleString("en-BD")}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Known estimated cost</p>
                    <p className="mt-1 text-xl font-bold">
                        ৳{total.toLocaleString("en-BD")}
                    </p>
                </div>
            </div>

            <div
                className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-sm font-medium ${
                    hasUnknownCosts
                        ? "bg-amber-50 text-amber-800"
                        : isOverBudget
                            ? "bg-rose-50 text-rose-800"
                            : "bg-emerald-50 text-emerald-800"
                }`}
            >
                {hasUnknownCosts ? (
                    <Info size={17} className="mt-0.5 shrink-0" />
                ) : isOverBudget ? (
                    <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                ) : (
                    <BadgeCheck size={17} className="mt-0.5 shrink-0" />
                )}

                <div>
                    {hasUnknownCosts ? (
                        <>
                            <p>Some place costs are unavailable.</p>
                            <p className="mt-1 text-xs font-normal">
                                Known costs: ৳{total.toLocaleString("en-BD")}
                                {remaining >= 0
                                    ? ` · ৳${remaining.toLocaleString("en-BD")} remaining before unknown costs`
                                    : ` · Already over budget by ৳${Math.abs(remaining).toLocaleString("en-BD")}`}
                            </p>
                        </>
                    ) : isOverBudget ? (
                        `Over budget by ৳${Math.abs(remaining).toLocaleString("en-BD")}`
                    ) : (
                        `Within budget — ৳${remaining.toLocaleString("en-BD")} remaining`
                    )}
                </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
                Costs are estimates based on the place dataset, not live prices.
                Unknown costs are not included in the estimated total.
            </p>
        </section>
    );
}
