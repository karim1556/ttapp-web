import type { ReactNode } from 'react'

export const EmptyState = ({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
      {icon}
    </div>
    <div className="text-lg font-semibold text-ink">{title}</div>
    {subtitle ? <div className="text-sm text-ink-muted">{subtitle}</div> : null}
    {action ? <div className="pt-2">{action}</div> : null}
  </div>
)
