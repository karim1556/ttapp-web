import type { Faculty } from './faculty'

export const UserRole = {
  Admin: 1,
  Faculty: 2,
  Student: 3,
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export interface User {
  uid: number
  email: string | null
  user_type: UserRole | null
}

export interface AuthProfile extends User {
  faculty?: Faculty
}

export interface LoginResponse {
  token: string
  user: User
}
