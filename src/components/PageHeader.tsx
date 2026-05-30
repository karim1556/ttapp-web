export const PageHeader = ({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) => (
  <div className="mb-6">
    <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">TT Manager</p>
    <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
      {title}
    </h1>
    {subtitle ? (
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">{subtitle}</p>
    ) : null}
  </div>
)
