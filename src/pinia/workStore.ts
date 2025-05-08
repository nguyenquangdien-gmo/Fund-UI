import { defineStore } from 'pinia'
import axiosInstance from '@/router/Interceptor'

// Define the API base path
const API_BASE_PATH = '/works'

// Define interfaces based on the API structures
interface WorkDTO {
  userId: number
  fromDate: string
  endDate: string
  startTime: string
  endTime: string
  type: string
  reason: string
  idCreate: string
}

interface WorkResponseDTO {
  id: number
  userId: number
  fullName: string
  fromDate: string
  endDate: string
  startTime: string
  endTime: string
  type: string
  timePeriod: string
  reason: string
  approvedById?: number
  approvedByName?: string
  createdAt: string
  idCreate: string
}

interface UserWorkResponse {
  userId: number
  fullName: string
  fromDate: string
  toDate: string
  type: string
  startTime: string
  endTime: string
}

interface WorkSummaryResponse {
  userId: number
  memberName: string
  wfhDays: number
  leaveDays: number
}

interface ApiResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
}

interface WorkState {
  works: WorkResponseDTO[]
  userWorks: Record<number, WorkResponseDTO[]>
  worksByDate: UserWorkResponse[]
  workSummaries: WorkSummaryResponse[]
  loading: boolean
  error: string | null
}

export const useWorkStore = defineStore('work', {
  state: (): WorkState => ({
    works: [],
    userWorks: {},
    worksByDate: [],
    workSummaries: [],
    loading: false,
    error: null,
  }),

  actions: {
    // Get all works
    async getAllWorks(): Promise<{ success: boolean; data?: WorkResponseDTO[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<WorkResponseDTO[]>>(`${API_BASE_PATH}`)
        this.works = response.data.data
        return { success: true, data: this.works }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch works'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Get works by user ID
    async getWorksByUserId(
      userId: number,
    ): Promise<{ success: boolean; data?: WorkResponseDTO[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<WorkResponseDTO[]>>(
          `${API_BASE_PATH}/user/${userId}`,
        )
        this.userWorks[userId] = response.data.data
        return { success: true, data: response.data.data }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : `Failed to fetch works for user ${userId}`
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Create a new work
    async createWork(
      workDTO: WorkDTO,
    ): Promise<{ success: boolean; data?: WorkResponseDTO[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.post<ApiResponse<WorkResponseDTO[]>>('/works', workDTO)
        // Update works list with new entries
        this.works = [...this.works, ...response.data.data]
        // Update user works if we have that user's works loaded
        if (this.userWorks[workDTO.userId]) {
          this.userWorks[workDTO.userId] = [
            ...this.userWorks[workDTO.userId],
            ...response.data.data,
          ]
        }
        return { success: true, data: response.data.data }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create work'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Get works by date
    async getWorksByDate(
      date: string,
    ): Promise<{ success: boolean; data?: UserWorkResponse[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<UserWorkResponse[]>>(
          `${API_BASE_PATH}/${date}`,
        )
        this.worksByDate = response.data.data
        return { success: true, data: this.worksByDate }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : `Failed to fetch works for date ${date}`
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Count work days in month by type
    async countWorkDaysInMonth(
      userId: number,
      year: number,
      month: number,
      type: string,
    ): Promise<{ success: boolean; data?: number; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<number>>(
          `${API_BASE_PATH}/user/${userId}/count`,
          {
            params: { year, month, type },
          },
        )
        return { success: true, data: response.data.data }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to count ${type} days for user ${userId} in ${month}/${year}`
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Get work summary by month
    async getWorkSummaryByMonth(
      year: number,
      month: number,
    ): Promise<{ success: boolean; data?: WorkSummaryResponse[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<WorkSummaryResponse[]>>(
          `${API_BASE_PATH}/work-summary`,
          {
            params: { year, month },
          },
        )
        this.workSummaries = response.data.data
        return { success: true, data: this.workSummaries }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to fetch work summary for ${month}/${year}`
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Get user work details by month
    async getUserWorkDetails(
      userId: number,
      year: number,
      month: number,
    ): Promise<{ success: boolean; data?: WorkResponseDTO[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get<ApiResponse<WorkResponseDTO[]>>(
          `${API_BASE_PATH}/user/${userId}/details`,
          {
            params: { year, month },
          },
        )
        return { success: true, data: response.data.data }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to fetch work details for user ${userId} in ${month}/${year}`
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Delete a work
    async deleteWork(id: number): Promise<{ success: boolean; error?: string }> {
      this.loading = true
      this.error = null

      try {
        await axiosInstance.delete<ApiResponse<void>>(`${API_BASE_PATH}/${id}`)

        // Remove work from local state
        this.works = this.works.filter((work) => work.id !== id)

        // Remove from user works if present
        Object.keys(this.userWorks).forEach((userId) => {
          this.userWorks[Number(userId)] = this.userWorks[Number(userId)].filter(
            (work) => work.id !== id,
          )
        })

        return { success: true }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : `Failed to delete work ${id}`
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Create work entry from successful leave or WFH request
    async createWorkFromRequest(payload: {
      userId: number
      type: string // 'LEAVE' or 'WFH'
      fromDate: string
      endDate: string
      startTime: string
      endTime: string
      reason: string
      idCreate?: string // Optional idCreate field
    }): Promise<{ success: boolean; data?: WorkResponseDTO[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        // Map the payload to WorkDTO format
        const workDTO: WorkDTO = {
          userId: payload.userId,
          fromDate: payload.fromDate,
          endDate: payload.endDate,
          startTime: payload.startTime,
          endTime: payload.endTime,
          type: payload.type,
          reason: payload.reason,
          idCreate: payload.idCreate || payload.userId.toString(), // Use provided idCreate or fallback to userId
        }

        // Create the work entry
        const response = await axiosInstance.post<ApiResponse<WorkResponseDTO | WorkResponseDTO[]>>('/works', workDTO)

        // Ensure this.works is initialized as an array
        if (!Array.isArray(this.works)) {
          this.works = [];
        }

        // Ensure response.data.data is treated as an array
        const responseData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data ? [response.data.data] : []);

        // Update works list with new entries
        this.works = [...this.works, ...responseData]

        // Update user works if we have that user's works loaded
        if (this.userWorks[workDTO.userId]) {
          this.userWorks[workDTO.userId] = [
            ...this.userWorks[workDTO.userId],
            ...responseData
          ]
        } else {
          // Initialize the user's works array if it doesn't exist
          this.userWorks[workDTO.userId] = [...responseData];
        }

        return { success: true, data: responseData }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create work entry from request'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    // Add a direct method to create work with exact format
    async createWorkDirect(workData: {
      userId: number
      fromDate: string
      endDate: string
      startTime: string
      endTime: string
      type: string
      reason: string
      idCreate: string
    }): Promise<{ success: boolean; data?: WorkResponseDTO[]; error?: string }> {
      this.loading = true
      this.error = null

      try {
        // Use the provided data directly without transformations
        const response = await axiosInstance.post<ApiResponse<WorkResponseDTO | WorkResponseDTO[]>>(
          '/works',
          workData,
        )

        // Ensure this.works is initialized as an array
        if (!Array.isArray(this.works)) {
          this.works = [];
        }

        // Ensure response.data.data is treated as an array
        const responseData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data ? [response.data.data] : []);

        // Update works list with new entries
        this.works = [...this.works, ...responseData];

        // Update user works if we have that user's works loaded
        if (this.userWorks[workData.userId]) {
          this.userWorks[workData.userId] = [
            ...this.userWorks[workData.userId],
            ...responseData
          ];
        } else {
          // Initialize the user's works array if it doesn't exist
          this.userWorks[workData.userId] = [...responseData];
        }
        
        return { success: true, data: responseData };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create work entry directly'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },
  },
})
