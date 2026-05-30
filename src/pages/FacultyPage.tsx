import { PageHeader } from '../components/PageHeader'

export const FacultyPage = () => (
  <div>
    <PageHeader
      title="Faculty"
      subtitle="Manage faculty profiles, assignments, and workload metadata."
    />
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
      Faculty management UI will live here. Connect this view to the
      faculty endpoints when you are ready to build the tables and forms.
    </div>
  </div>
)
