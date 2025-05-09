// src/stores/leaveRequestStore.ts
import { defineStore } from 'pinia'
import Cookies from 'js-cookie'
import axiosInstance from '@/router/CreateApiInstance'

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
  token: string
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
    isAuthenticated: (): boolean => !!Cookies.get('user'),
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

        const response = await axiosInstance.post<ApiResponse<User>>(
          '/admin-create/login',
          formData,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        )
        console.log(response.data)

        if (response.data) {
          this.user = response.data.data
          Cookies.set(
            'user',
            JSON.stringify({
              userObjId: this.user.userObjId,
              name: this.user.name,
              staffCode: this.user.staffCode,
              userPositionCode: this.user.userPositionCode,
              departmentCode: this.user.departmentCode,
            }),
            { path: '/' },
          )
          console.log(Cookies.get('user'))

          return { 
            success: true, 
            data: response.data.data
          }
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
    async logout(): Promise<{ success: boolean; error?: string }> {
      this.loading = true;
      this.error = null;
      
      try {
        // Call the logout API endpoint
        const response = await axiosInstance.post('/admin-create/logout', {});
        
        // Clear user state regardless of API response
        this.user = null;
        Cookies.remove('user');
        
        return { success: true };
      } catch (error: unknown) {
        // Still remove cookies even if API call fails
        this.user = null;
        Cookies.remove('user');
        
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng xuất';
        this.error = errorMessage;
        return { success: false, error: errorMessage };
      } finally {
        this.loading = false;
      }
    },

    // Lấy danh sách loại đơn nghỉ
    async fetchLeaveTypes(): Promise<{ success: boolean; data?: LeaveType[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<LeaveType[]>>(
          '/admin-create/leave-types',
        )

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
        const response = await axiosInstance.get<ApiResponse<Reporter[]>>('/admin-create/reporters')

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

    // Xóa đơn nghỉ
    async deleteLeaveRequest(
      staffAttendanceObjId: string,
    ): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.delete<ApiResponse<Record<string, unknown>>>(
          '/admin-create/leave/delete',
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
      staffWfhObjId: string,
    ): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.delete<ApiResponse<Record<string, unknown>>>(
          '/admin-create/wfh/delete',
          {
            data: { staffWfhObjId },
          },
        )

        if (response.data.success) {
          // Cập nhật danh sách đơn WFH
          this.leaveRequests = this.leaveRequests.filter((request) => request._id !== staffWfhObjId)
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
          '/admin-create/staff-attendance/list',
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
          await axiosInstance.get<ApiResponse<LeaveRequest[]>>('/admin-create/my-wfh-requests')

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
          '/admin-create/leave/create',
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
          '/admin-create/wfh/create',
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

    // Fetch personal staff attendance
    async fetchPersonalStaffAttendance(params: {
      startDate: string
      endDate: string
      fromDate: number
      toDate: number
      page: number
      userObjId: string
    }): Promise<{ success: boolean; data?: LeaveRequest[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<{ items: LeaveRequest[] } | LeaveRequest[]>>(
          '/admin-create/personal-staff-attendance',
          { params },
        )

        if (response.data.success) {
          // Check if the data has an 'items' property or is already an array
          const items = Array.isArray(response.data.data) 
            ? response.data.data 
            : response.data.data?.items || [];
          
          console.log('Attendance items:', items);
          return { success: true, data: items }
        } else {
          throw new Error(response.data.message || 'Không thể lấy dữ liệu staff attendance')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy dữ liệu staff attendance'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    async fetchPersonalStaffWfh(params: {
      endDate: string
      fromDate: string
      toDate: number
      page: number
      userObjId: string
    }): Promise<{ success: boolean; data?: LeaveRequest[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<{ items: LeaveRequest[] } | LeaveRequest[]>>(
          '/admin-create/personal-staff-wfh',
          { params },
        )

        if (response.data.success) {
          // Check if the data has an 'items' property or is already an array
          const items = Array.isArray(response.data.data) 
            ? response.data.data 
            : response.data.data?.items || [];
          
          console.log('WFH items:', items);
          return { success: true, data: items }
        } else {
          throw new Error(response.data.message || 'Không thể lấy dữ liệu staff WFH')
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy dữ liệu staff WFH'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },
  },
})
