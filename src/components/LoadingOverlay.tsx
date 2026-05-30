import type { ReactNode } from 'react'

export const LoadingOverlay = ({
  isLoading,
  message,
  children,
}: {
  isLoading: boolean
  message?: string
  children: ReactNode
}) => (
  <div className="relative">
    {children}
    {isLoading ? (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-soft">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
          {message ? (
            <p className="mt-4 text-sm text-ink-muted">{message}</p>
          ) : null}
        </div>
      </div>
    ) : null}
  </div>
)
