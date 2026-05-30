type FormFieldProps = {
  label: string
  type?: string
  name: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export const FormField = ({
  label,
  type = 'text',
  name,
  value,
  placeholder,
  onChange,
}: FormFieldProps) => (
  <label className="grid gap-2 text-sm text-ink">
    <span className="font-semibold">{label}</span>
    <input
      className="rounded-xl border border-border bg-white px-4 py-2 text-ink shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      type={type}
      name={name}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)
