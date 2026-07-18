import { CheckCircle2, CircleAlert, Target } from "lucide-react";
import type { IntentCheck } from "@/lib/types";

type IntentCheckCardProps = {
  intentCheck: IntentCheck;
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
};

export function IntentCheckCard({ intentCheck, acknowledged, onAcknowledgedChange }: IntentCheckCardProps) {
  const needsAttention = intentCheck.status === "needs_attention";
  const aligned = intentCheck.status === "aligned";
  const Icon = needsAttention ? CircleAlert : aligned ? CheckCircle2 : Target;
  const title = needsAttention ? "Scope needs attention" : aligned ? "Intent appears aligned" : "No stated intent";
  const tone = needsAttention
    ? "border-amber-200 bg-amber-50 text-amber-950"
    : aligned
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-line bg-white text-ink";

  return (
    <section className={`rounded border px-4 py-4 ${tone}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">Intent check: {title}</h2>
            {intentCheck.status !== "not_provided" ? <span className="text-xs font-semibold uppercase">Scope contract</span> : null}
          </div>
          {intentCheck.intent ? <p className="mt-2 text-sm font-medium">{intentCheck.intent}</p> : null}
          <p className="mt-2 text-sm">{intentCheck.summary}</p>

          {intentCheck.matchedTerms.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Matched intent terms">
              {intentCheck.matchedTerms.map((term) => (
                <span key={term} className="rounded border border-current/20 bg-white/60 px-2 py-1 text-xs font-semibold">
                  {term}
                </span>
              ))}
            </div>
          ) : null}

          {needsAttention ? (
            <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-current/15 pt-3 text-sm font-semibold">
              <input
                className="mt-0.5 h-4 w-4 accent-ink"
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => onAcknowledgedChange(event.target.checked)}
              />
              <span>I reviewed the stated intent and the possible scope drift.</span>
            </label>
          ) : null}
        </div>
      </div>
    </section>
  );
}
