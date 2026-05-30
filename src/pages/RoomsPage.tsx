import { PageHeader } from '../components/PageHeader'

export const RoomsPage = () => (
  <div>
    <PageHeader
      title="Rooms"
      subtitle="Manage room inventory and teaching capacity."
    />
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
      Add filters, room cards, and edit dialogs here.
    </div>
  </div>
)
