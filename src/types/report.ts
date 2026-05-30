export interface ClassroomUsageRow {
  roomId: number | null
  roomNumber: string
  name?: string | null
  roomType?: string | null
  branchId?: number | null
  isActive?: number | null
  assignedLectures: number
  totalWeeklySlotsPerRoom: number
  utilizationPercent: number
}

export interface ClassroomUsageReport {
  slotsPerDay: number
  totalWeeklySlotsPerRoom: number
  rooms: ClassroomUsageRow[]
}
