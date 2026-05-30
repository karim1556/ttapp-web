export const StatCard = ({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) => (
  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">{label}</p>
    <div className="mt-3 text-2xl font-semibold text-ink">{value}</div>
    {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
  </div>
)
