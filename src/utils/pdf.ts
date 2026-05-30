import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { TimetableDay } from '../types/timetable'

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
]

const TIME_END_MAP: Record<string, string> = {
  '08:00': '09:00',
  '09:00': '10:00',
  '10:00': '11:00',
  '11:00': '12:00',
  '12:00': '13:00',
  '13:00': '14:00',
  '14:00': '15:00',
  '15:00': '16:00',
  '16:00': '17:00',
}

export const downloadTimetablePdf = (
  weekly: TimetableDay[],
  options?: { branchId?: number; semester?: number; division?: string },
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()

  // Build day-slot map
  const daySlotMap = new Map<string, Map<string, any>>()
  const endByStart = new Map<string, string>()
  const allTimeKeys = new Set<string>()

  for (const day of weekly) {
    const dayName = day.dateOfWeek ?? ''
    if (!daySlotMap.has(dayName)) daySlotMap.set(dayName, new Map())
    const slots = daySlotMap.get(dayName)!

    for (const slot of day.slots) {
      const startH = String(slot.startTimeHr ?? 0).padStart(2, '0')
      const startM = String(slot.startTimeMinutes ?? 0).padStart(2, '0')
      const endH = String(slot.endTimeHr ?? 0).padStart(2, '0')
      const endM = String(slot.endTimeMinutes ?? 0).padStart(2, '0')
      const key = `${startH}:${startM}`
      const endKey = `${endH}:${endM}`

      slots.set(key, slot)
      endByStart.set(key, endKey)
      allTimeKeys.add(key)
    }
  }

  const sortedTimes = [...allTimeKeys].sort()
  if (sortedTimes.length === 0) {
    sortedTimes.push(...TIME_SLOTS)
  }

  const availableDays = [
    ...DAYS_ORDER.filter((d) => daySlotMap.has(d)),
    ...[...daySlotMap.keys()].filter((d) => !DAYS_ORDER.includes(d)),
  ]

  if (availableDays.length === 0) {
    doc.text('No timetable data available', pageWidth / 2, 50, { align: 'center' })
    doc.save('timetable.pdf')
    return
  }

  const now = new Date()
  const generatedStamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // Count stats
  let totalLectures = 0
  let totalLabs = 0
  let occupiedCells = 0
  for (const dayName of availableDays) {
    const slots = daySlotMap.get(dayName)
    if (!slots) continue
    for (const startKey of sortedTimes) {
      const slot = slots.get(startKey)
      if (slot && slot.lectures.length > 0) {
        occupiedCells++
        for (const lec of slot.lectures) {
          totalLectures++
          if (lec.isLabLecture || (lec.typeOfLecture?.toLowerCase() === 'lab')) {
            totalLabs++
          }
        }
      }
    }
  }
  const totalCells = availableDays.length * sortedTimes.length
  const occupancyPercent = totalCells === 0 ? 0 : Math.round((occupiedCells * 100) / totalCells)

  // Title
  doc.setFillColor(18, 50, 97)
  doc.rect(10, 10, pageWidth - 20, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('Weekly Timetable', 16, 25)
  doc.setFontSize(9)
  doc.text('Academic schedule overview with room and faculty allocation', 16, 33)

  doc.setFillColor(10, 36, 73)
  const genText = `Generated ${generatedStamp}`
  const genW = doc.getTextWidth(genText) + 8
  doc.rect(pageWidth - 16 - genW, 13, genW, 7, 'F')
  doc.setTextColor(242, 246, 255)
  doc.setFontSize(8)
  doc.text(genText, pageWidth - 16 - genW + 4, 18)

  // Metrics row
  const metricY = 46
  const metricH = 14
  const metricW = (pageWidth - 36) / 4
  const metrics = [
    { label: 'Branch', value: options?.branchId?.toString() ?? 'All' },
    { label: 'Semester / Division', value: `${options?.semester?.toString() ?? '-'} / ${options?.division ?? '-'}` },
    { label: 'Lecture Slots', value: `${totalLectures} total | ${totalLabs} lab` },
    { label: 'Grid Occupancy', value: `${occupancyPercent}%` },
  ]
  for (let i = 0; i < metrics.length; i++) {
    const x = 14 + i * (metricW + 4)
    doc.setFillColor(30, 103, 197)
    doc.roundedRect(x, metricY, metricW, metricH, 2, 2, 'F')
    doc.setTextColor(220, 233, 255)
    doc.setFontSize(7)
    doc.text(metrics[i].label, x + 3, metricY + 5)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(metrics[i].value, x + 3, metricY + 12)
    doc.setFont('helvetica', 'normal')
  }

  // Build table data
  const headerRow = ['Time', ...availableDays.map((d) => d.length > 3 ? d.substring(0, 3) : d)]
  const dataRows = sortedTimes.map((startKey) => {
    const endKey = endByStart.get(startKey) ?? TIME_END_MAP[startKey] ?? ''
    const timeLabel = endKey ? `${startKey}\n-\n${endKey}` : startKey

    const row = [timeLabel]
    for (const dayName of availableDays) {
      const slots = daySlotMap.get(dayName)
      const slot = slots?.get(startKey)
      if (!slot || slot.lectures.length === 0) {
        row.push(startKey === '12:00' ? 'Lunch Break' : 'Free')
      } else {
        const lines = slot.lectures.map((lec: any) => {
          const subject = (lec.subject_name ?? lec.subjectCode ?? 'Untitled').trim()
          const faculty = (lec.faculty_name ?? '').trim()
          const room = (lec.room_number ?? '').trim()
          const batch = (lec.batch ?? '').trim()
          const isLab = lec.isLabLecture || (lec.typeOfLecture?.toLowerCase() === 'lab')
          const type = isLab ? 'Lab Session' : 'Lecture'
          const details = [faculty, room ? `Room ${room}` : '', batch ? `Batch ${batch}` : '', type]
            .filter(Boolean)
            .join(' | ')
          return details ? `${subject} (${details})` : subject
        })
        row.push(lines.join('\n'))
      }
    }
    return row
  })

  // Render table
  autoTable(doc, {
    head: [headerRow],
    body: dataRows,
    startY: metricY + metricH + 8,
    styles: {
      fontSize: 7,
      textColor: [27, 44, 72],
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 103, 197],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [242, 247, 255],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center', valign: 'middle' },
    },
    rowPageBreak: 'auto',
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.column.index === 0) {
        data.cell.styles.halign = 'center'
        data.cell.styles.valign = 'middle'
      }
    },
  })

  // Legend
  const finalY = (doc as any).lastAutoTable?.finalY ?? 200
  doc.setFillColor(240, 244, 248)
  doc.roundedRect(14, finalY + 6, pageWidth - 28, 10, 2, 2, 'F')
  doc.setDrawColor(210, 223, 242)
  doc.setFillColor(31, 95, 182)
  doc.circle(22, finalY + 11, 2, 'F')
  doc.setTextColor(47, 60, 86)
  doc.setFontSize(7)
  doc.text('Lecture / Theory', 27, finalY + 11.5)
  doc.setFillColor(19, 121, 91)
  doc.circle(62, finalY + 11, 2, 'F')
  doc.text('Lab Session (2 slots)', 67, finalY + 11.5)
  doc.setFillColor(138, 153, 179)
  doc.circle(110, finalY + 11, 2, 'F')
  doc.text('Free / Break', 115, finalY + 11.5)
  doc.setTextColor(78, 94, 123)
  doc.text('Generated by TTAPP', pageWidth - 30, finalY + 11.5)

  doc.save('timetable.pdf')
}