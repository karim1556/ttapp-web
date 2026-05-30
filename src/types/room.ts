export interface Room {
  id: number
  room_number: string
  name?: string | null
  capacity?: number | null
  room_type?: string | null
  branch_id?: number | null
  floor?: string | null
  is_active?: number | null
}
