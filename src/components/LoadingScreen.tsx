export const LoadingScreen = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="flex min-h-[40vh] items-center justify-center gap-3">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
    <span className="text-sm text-ink-muted">{label}</span>
  </div>
)
