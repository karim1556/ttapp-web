import type { ReactNode } from 'react'

export const ErrorState = ({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode
  title: string
  message?: string | null
  action?: ReactNode
}) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-error/30 bg-error/10 px-6 py-10 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/20 text-error">
      {icon}
    </div>
    <div className="text-lg font-semibold text-error">{title}</div>
    {message ? <div className="text-sm text-error">{message}</div> : null}
    {action ? <div className="pt-2">{action}</div> : null}
  </div>
)
