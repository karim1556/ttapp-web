import { Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { UserRole } from '../types/auth'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import { AdminStatsPage } from '../pages/AdminStatsPage'
import { CopoPage } from '../pages/CopoPage'
import { ConstraintsPage } from '../pages/ConstraintsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { FacultyPage } from '../pages/FacultyPage'
import { HolidaysPage } from '../pages/HolidaysPage'
import { LoginPage } from '../pages/LoginPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { RoomsPage } from '../pages/RoomsPage'
import { SubjectsPage } from '../pages/SubjectsPage'
import { SubstitutionsPage } from '../pages/SubstitutionsPage'
import { TimetablePage } from '../pages/TimetablePage'
import { TimeslotsPage } from '../pages/TimeslotsPage'
import { TodayPage } from '../pages/TodayPage'
import { AdminPanelPage } from '../pages/AdminPanelPage'
import { ManageTeachersPage } from '../pages/ManageTeachersPage'
import { ManageSubjectsPage } from '../pages/ManageSubjectsPage'
import { ManageRoomsPage } from '../pages/ManageRoomsPage'
import { ManageTimeslotsPage } from '../pages/ManageTimeslotsPage'
import { RoomReportsPage } from '../pages/RoomReportsPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="home" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="holidays" element={<HolidaysPage />} />

        <Route element={<RoleRoute allowed={[UserRole.Admin, UserRole.Faculty]} />}>
          <Route path="constraints" element={<ConstraintsPage />} />
          <Route path="substitutions" element={<SubstitutionsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route element={<RoleRoute allowed={[UserRole.Admin]} />}>
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="faculty" element={<FacultyPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="timeslots" element={<TimeslotsPage />} />
          <Route path="copo" element={<CopoPage />} />
          <Route path="admin" element={<AdminPanelPage />} />
          <Route path="admin/stats" element={<AdminStatsPage />} />
          <Route path="admin/teachers" element={<ManageTeachersPage />} />
          <Route path="admin/subjects" element={<ManageSubjectsPage />} />
          <Route path="admin/rooms" element={<ManageRoomsPage />} />
          <Route path="admin/timeslots" element={<ManageTimeslotsPage />} />
          <Route path="admin/rooms/reports" element={<RoomReportsPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
)
