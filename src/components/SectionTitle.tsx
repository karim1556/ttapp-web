export const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) => (
  <div>
    <h2 className="text-lg font-semibold text-ink">{title}</h2>
    {subtitle ? <p className="text-sm text-ink-muted">{subtitle}</p> : null}
  </div>
)
