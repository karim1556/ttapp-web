export const academicYearOptions = () => {
  const now = new Date()
  const year = now.getFullYear()
  // JS getMonth() is 0-indexed: 5 = June
  const start = now.getMonth() >= 5 ? year : year - 1
  return Array.from({ length: 5 }, (_, i) => {
    const from = start - i
    const to = (from + 1) % 100
    const toStr = to.toString().padStart(2, '0')
    return `${from}-${toStr}`
  })
}

export const currentAcademicYear = () => academicYearOptions()[0]
