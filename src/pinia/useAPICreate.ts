// src/stores/leaveRequestStore.ts
import { defineStore } from 'pinia'
import Cookies from 'js-cookie'
import axiosInstance, { saveAuthToken, removeAuthToken } from '@/router/CreateApiInstance'

// Định nghĩa các interface dựa trên dữ liệu thực tế
interface Position {
  _id: string
  name: string
}

interface Department {
  _id: string
  name: string
}

interface Branch {
  _id: string
  name: string
}

interface User {
  _id?: string
  userObjId?: string
  name?: string
  staffCode?: number
  positionObjId?: string | Position
  userPositionObjId?: string | Position
  branchObjId?: string | Branch
  departmentObjId?: string | Department
  email?: string
  username?: string
  userStatus?: string
  token?: string
  emailPersonal?: string
  userLevel?: string | null
  userSubPositionObjId?: string | null
  updatedAt?: string
  uid?: string
  positionCode?: string
  positionName?: string
  positionDescription?: string
  subPositionName?: string | null
  subPositionCode?: string | null
  subPositionDescription?: string | null
  subPositionObjId?: string | null
  userPositionCode?: string
  userPositionName?: string
  userPositionDescription?: string
  departmentCode?: string
  departmentName?: string
  departmentDescription?: string
  branchCode?: string
  branchName?: string
  isOnsite?: boolean
  isPM?: boolean
  isManagerApproveOT?: boolean
  enableStaffWfh?: boolean
  birthDay?: string
  phone?: string
  gender?: string
  address?: string | null
  officialDate?: string | null
  probationDate?: string | null
  internDate?: string
  welcomeDate?: string
  timekeepingDate?: string
  quitDate?: string | null
  [key: string]: unknown
}

interface LeaveType {
  _id: string
  attendanceTypeName: string
  attendanceTypeCode: string
  attendanceWorkDay: number
  type: string
  status: string
  [key: string]: unknown
}

interface UserInfo {
  position?: string
  department?: string
  branch?: string
}

interface Reporter {
  _id: string
  name: string
  username: string
  email: string
  staffCode: number
  userPositionObjId: Position | string
  departmentObjId: Department | string
  positionObjId: Position | string
  branchObjId: Branch | string
  userLevel?: string
  status?: string
  UserInfo?: UserInfo
  id?: string
}

interface AttendanceType {
  _id: string
  name: string
  code: string
}

interface LeaveRequest {
  _id: string
  fromDate: string
  endDate: string
  reason: string
  statusApproval: string
  userObjId: User | string
  reportObjId: Reporter | string
  attendanceTypeObjId?: AttendanceType | string
  absentDay?: number
  createdAt?: string
  type?: string
  [key: string]: unknown
}

interface ApiResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
}

interface LeaveRequestState {
  user: User | null
  leaveTypes: LeaveType[]
  reporters: Reporter[]
  leaveRequests: LeaveRequest[]
  loading: boolean
  error: string | null
}

export const useLeaveRequestStore = defineStore('leaveRequest', {
  state: (): LeaveRequestState => ({
    user: null,
    leaveTypes: [],
    reporters: [],
    leaveRequests: [],
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (): boolean => !!Cookies.get('AUTHTOKEN'),
    getUserId: (state): string | undefined => state.user?.userObjId,
    getUserInfo: (state): User | null => state.user,
  },

  actions: {
    // Đăng nhập
    async signIn(
      username: string,
      password: string,
    ): Promise<{ success: boolean; data?: User; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const formData = new URLSearchParams()
        formData.append('username', username)
        formData.append('password', password)

        const response = await axiosInstance.post<ApiResponse<User>>('/signIn', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })

        if (response.data.success) {
          this.user = response.data.data
          const token = response.data.data.token || ''

          // Save token to cookie
          saveAuthToken(token)

          // Store stringified user data in cookie
          Cookies.set(
            'user',
            JSON.stringify({
              userObjId: this.user.userObjId,
              name: this.user.name,
              staffCode: this.user.staffCode,
              userPositionCode: this.user.userPositionCode,
              departmentCode: this.user.departmentCode,
            }),
          )

          return { success: true, data: response.data.data }
        } else {
          throw new Error(response.data.message || 'Đăng nhập thất bại')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng nhập'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Đăng xuất
    logout(): void {
      this.user = null
      removeAuthToken()
    },

    // Lấy danh sách loại đơn nghỉ
    async fetchLeaveTypes(): Promise<{ success: boolean; data?: LeaveType[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<LeaveType[]>>('/list-staff-attendance')

        if (response.data.success) {
          this.leaveTypes = response.data.data || []
          return { success: true, data: this.leaveTypes }
        } else {
          throw new Error(response.data.message || 'Không thể lấy danh sách loại đơn nghỉ')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy danh sách loại đơn nghỉ'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Lấy danh sách người duyệt đơn
    async fetchReporters(): Promise<{ success: boolean; data?: Reporter[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<Reporter[]>>(
          '/authDefault/listReporter',
        )

        if (response.data.success) {
          this.reporters = response.data.data || []
          return { success: true, data: this.reporters }
        } else {
          throw new Error(response.data.message || 'Không thể lấy danh sách người duyệt đơn')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy danh sách người duyệt đơn'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Tạo đơn nghỉ phép
    async createLeaveRequest(payload: {
      attendanceTypeObjId: string
      reportObjId: string
      fromDate: string
      endDate: string
      reason: string
    }): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.post<ApiResponse<LeaveRequest>>(
          '/auth/staff-attendance/create',
          payload,
        )

        if (response.data.success) {
          const newLeaveRequest = response.data.data
          this.leaveRequests.push(newLeaveRequest)
          return { success: true, data: newLeaveRequest }
        } else {
          throw new Error(response.data.message || 'Tạo đơn nghỉ thất bại')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo đơn nghỉ'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Tạo đơn WFH
    async createWfhRequest(payload: {
      reportObjId: string
      fromDate: string
      endDate: string
      reason: string
    }): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.post<ApiResponse<LeaveRequest>>(
          '/auth/staff-wfh/create',
          payload,
        )

        if (response.data.success) {
          const newWfhRequest = response.data.data
          this.leaveRequests.push(newWfhRequest)
          return { success: true, data: newWfhRequest }
        } else {
          throw new Error(response.data.message || 'Tạo đơn WFH thất bại')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo đơn WFH'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Xóa đơn nghỉ
    async deleteLeaveRequest(
      staffAttendanceObjId: string,
    ): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.delete<ApiResponse<Record<string, unknown>>>(
          '/auth/staff-attendance/delete',
          {
            data: { staffAttendanceObjId },
          },
        )

        if (response.data.success) {
          // Cập nhật danh sách đơn nghỉ
          this.leaveRequests = this.leaveRequests.filter(
            (request) => request._id !== staffAttendanceObjId,
          )
          return { success: true, data: response.data.data }
        } else {
          throw new Error(response.data.message || 'Xóa đơn nghỉ thất bại')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa đơn nghỉ'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Xóa đơn WFH
    async deleteWfhRequest(
      wfhObjId: string,
    ): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.delete<ApiResponse<Record<string, unknown>>>(
          '/auth/staff-wfh/delete',
          {
            data: { wfhObjId },
          },
        )

        if (response.data.success) {
          // Cập nhật danh sách đơn WFH
          this.leaveRequests = this.leaveRequests.filter((request) => request._id !== wfhObjId)
          return { success: true, data: response.data.data }
        } else {
          throw new Error(response.data.message || 'Xóa đơn WFH thất bại')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa đơn WFH'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Lấy danh sách đơn nghỉ đã tạo
    async fetchMyLeaveRequests(): Promise<{
      success: boolean
      data?: LeaveRequest[]
      error?: string
    }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<LeaveRequest[]>>(
          '/auth/staff-attendance/list',
        )

        if (response.data.success) {
          this.leaveRequests = response.data.data || []
          return { success: true, data: this.leaveRequests }
        } else {
          throw new Error(response.data.message || 'Không thể lấy danh sách đơn nghỉ')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy danh sách đơn nghỉ'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Lấy danh sách đơn WFH đã tạo
    async fetchMyWfhRequests(): Promise<{
      success: boolean
      data?: LeaveRequest[]
      error?: string
    }> {
      this.loading = true
      this.error = null

      try {
        const response =
          await axiosInstance.get<ApiResponse<LeaveRequest[]>>('/auth/staff-wfh/list')

        if (response.data.success) {
          const wfhRequests = response.data.data || []
          // Có thể thêm vào danh sách chung hoặc lưu riêng tùy thuộc vào cách bạn muốn quản lý
          this.leaveRequests = [...this.leaveRequests, ...wfhRequests]
          return { success: true, data: wfhRequests }
        } else {
          throw new Error(response.data.message || 'Không thể lấy danh sách đơn WFH')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy danh sách đơn WFH'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Tạo đơn nghỉ phép mới
    async createLeaveRequestNew(payload: {
      attendanceTypeObjId: string
      reportObjId: string
      fromDate: string
      fromTime: string
      endDate: string
      endTime: string
      reason: string
      relationshipObjIds?: string[]
    }): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> {
      this.loading = true
      this.error = null

      try {
        // Format dates as required by the API (YYYY-MM-DD HH:MM:SS)
        const formattedFromDate = `${payload.fromDate} ${payload.fromTime}:00`
        const formattedEndDate = `${payload.endDate} ${payload.endTime}:00`

        const apiPayload = {
          userObjId: this.user?.userObjId,
          staffAttendanceTypeObjId: payload.attendanceTypeObjId,
          reportObjId: payload.reportObjId,
          fromDate: formattedFromDate,
          endDate: formattedEndDate,
          note: payload.reason,
          reason: payload.reason,
          relationshipObjIds: payload.relationshipObjIds || [],
        }

        const response = await axiosInstance.post<ApiResponse<LeaveRequest>>(
          '/auth/staff-attendance/create',
          apiPayload,
        )

        if (response.data.success) {
          const newLeaveRequest = response.data.data
          this.leaveRequests.push(newLeaveRequest)
          return { success: true, data: newLeaveRequest }
        } else {
          throw new Error(response.data.message || 'Tạo đơn nghỉ thất bại')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo đơn nghỉ'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Tạo đơn WFH mới
    async createWfhRequestNew(payload: {
      applicant_person: string
      staff_code: number
      positon: string
      department: string
      reportObjId: string
      createAt: string
      fromDate: string
      endDate: string
      reason: string
      userObjId: string
    }): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.post<ApiResponse<LeaveRequest>>(
          '/auth/staff-wfh/create',
          payload,
        )

        if (response.data.success) {
          const newWfhRequest = response.data.data
          this.leaveRequests.push(newWfhRequest)
          return { success: true, data: newWfhRequest }
        } else {
          throw new Error(response.data.message || 'Tạo đơn WFH thất bại')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo đơn WFH'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },
  },
})
