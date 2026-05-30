import { UserRole } from '../types/auth'

export const roleLabels: Record<UserRole, string> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.Faculty]: 'Faculty',
  [UserRole.Student]: 'Student',
}

export const isAdmin = (role?: UserRole | null) => role === UserRole.Admin
export const isFaculty = (role?: UserRole | null) => role === UserRole.Faculty
export const isStudent = (role?: UserRole | null) => role === UserRole.Student
