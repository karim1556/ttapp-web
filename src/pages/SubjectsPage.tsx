import { PageHeader } from '../components/PageHeader'

export const SubjectsPage = () => (
  <div>
    <PageHeader
      title="Subjects"
      subtitle="Review subject metadata, credits, and professor assignments."
    />
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
      Subject CRUD flows will be added here. The API wiring is ready in
      the client module.
    </div>
  </div>
)
