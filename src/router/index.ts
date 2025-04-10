import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/auth/LoginView.vue'
import HistoryView from '@/views/HistoryView.vue'
import ContributionsView from '@/views/ContributionsView.vue'
import FundView from '@/views/admin/FundView.vue'
import PeriodView from '@/views/admin/PeriodView.vue'
import PenaltyView from '@/views/admin/PenaltyView.vue'
import PayPenView from '@/views/PayPenView.vue'
import axios from 'axios'
import StatsView from '@/views/StatsView.vue'
import TransactionView from '@/views/admin/TransactionView.vue'
import UserView from '@/views/admin/UserView.vue'
import NotContributionsView from '@/views/admin/NotContributionsView.vue'
import LateContributions from '@/views/admin/LateContributions.vue'
import LateListView from '@/views/admin/LateListView.vue'
import ApprovingView from '@/views/admin/ApprovingView.vue'
import EventView from '@/views/EventView.vue'
import LateHistories from '@/views/LateHistories.vue'
import TeamView from '@/views/admin/TeamView.vue'
import ProfileView from '@/views/ProfileView.vue'
import RoleView from '@/views/admin/RoleView.vue'
import ReminderView from '@/views/admin/ReminderView.vue'
import UserReminderView from '@/views/UserReminderView.vue'
import InvoiceView from '@/views/admin/InvoiceView.vue'
import UserInvoiceView from '@/views/UserInvoiceView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '/stats',
      component: StatsView,
      meta: { requiresAuth: true }, // Yêu cầu phải đăng nhập
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/histories',
      name: 'histories',
      component: HistoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/user/late',
      name: 'user-late',
      component: LateHistories,
      meta: { requiresAuth: true },
    },
    {
      path: '/events',
      name: 'events',
      component: EventView,
      meta: { requiresAuth: true },
    },
    {
      path: '/contributions',
      name: 'contributions',
      component: ContributionsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/bills',
      name: 'bills',
      component: PayPenView,
      meta: { requiresAuth: true },
    },
    {
      path: '/users/not-paid',
      name: 'not-paid',
      component: NotContributionsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/users/late-contributions',
      name: 'late-contributions',
      component: LateContributions,
      meta: { requiresAuth: true },
    },
    {
      path: '/stats',
      name: 'stats',
      component: StatsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/user/reminders',
      name: 'user-reminders',
      component: UserReminderView,
      meta: { requiresAuth: true },
    },
    {
      path: '/user/invoices',
      name: 'user-invoices',
      component: UserInvoiceView,
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'users',
      component: UserView,
      meta: { requiresAuth: true },
    },
    {
      path: '/user/late',
      name: 'user-late',
      component: LateHistories,
      meta: { requiresAuth: true },
    },
    {
      path: '/invoices',
      name: 'invoices',
      component: InvoiceView,
      meta: { requiresAuth: true },
    },
    {
      path: '/late-checkin',
      name: 'late-checkin',
      component: LateListView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/teams',
      name: 'teams',
      component: TeamView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/roles',
      name: 'roles',
      component: RoleView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/invoices',
      name: 'invoices',
      component: InvoiceView,
      meta: { requiresAuth: true },
    },
    {
      path: '/approvals',
      name: 'approvals',
      component: ApprovingView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/funds',
      name: 'funds',
      component: FundView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/periods',
      name: 'periods',
      component: PeriodView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/logs',
      name: 'logs',
      component: TransactionView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/reminders',
      name: 'reminders',
      component: ReminderView,
      meta: { requiresAdmin: true, requiresAuth: true },
    },
    {
      path: '/penalties',
      name: 'penalties',
      component: PenaltyView,
      meta: { requiresAdmin: true, requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFound.vue'),
    },
  ],
})

// Hàm kiểm tra người dùng có phải admin không
const checkAdmin = async () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return false
  try {
    const response = await axios.get('http://localhost:8080/api/v1/tokens/is-admin', {
      params: { token },
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data // Trả về true nếu là admin
  } catch (error) {
    // consol e.error('Lỗi khi kiểm tra quyền admin:', error)
    return false
  }
}

const checkExpired = async () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return false
  try {
    const response = await axios.get('http://localhost:8080/api/v1/tokens/expired', {
      params: { token },
    })
    return response.data // Trả về true nếu là admin
  } catch (error) {
    console.error('Lỗi khi kiểm tra quyền admin:', error)
    return false
  }
}

// Middleware kiểm tra quyền truy cập trước khi vào trang
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('accessToken')
  const isAuthenticated = !!token
  const isExpired = await checkExpired()

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'login' }) // Nếu chưa đăng nhập, chuyển đến login
  }
  if (isExpired) {
    localStorage.removeItem('accessToken')

    return next({ name: 'login' }) // Nếu token đã hết hạn, chuyển đến login
  }

  if (to.meta.requiresAdmin) {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
      return next({ name: 'not-found' }) // Nếu không phải admin, chuyển đến NotFound
    }
  }

  next()
})

export default router
