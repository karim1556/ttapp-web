export const academicYearOptions = () => {
  const now = new Date()
  const year = now.getFullYear()
  const start = now.getMonth() < 6 ? year - 1 : year
  return Array.from({ length: 5 }, (_, i) => {
    const from = start - i
    return `${from}-${from + 1}`
  })
}

export const currentAcademicYear = () => academicYearOptions()[0]
