import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '@/views/auth/RegisterView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import HistoryView from '@/views/HistoryView.vue'
import ContributionsView from '@/views/ContributionsView.vue'
import OwedView from '@/views/OwedView.vue'
import FundView from '@/views/admin/FundView.vue'
import PeriodView from '@/views/admin/PeriodView.vue'
import PenaltyView from '@/views/admin/PenaltyView.vue'
import PayPenView from '@/views/PayPenView.vue'
import axios from 'axios'
import StatsView from '@/views/admin/StatsView.vue'
import ExpenseView from '@/views/admin/ExpenseView.vue'
import TransactionView from '@/views/admin/TransactionView.vue'
import ReminderView from '@/views/ReminderView.vue'
import UserView from '@/views/admin/UserView.vue'
import NotContributionsView from '@/views/admin/NotContributionsView.vue'
import LateContributions from '@/views/admin/LateContributions.vue'
import LateListView from '@/views/admin/LateListView.vue'
import ApprovingView from '@/views/admin/ApprovingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HistoryView,
      meta: { requiresAuth: true }, // Yêu cầu phải đăng nhập
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/histories',
      name: 'histories',
      component: HistoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/contributions',
      name: 'contributions',
      component: ContributionsView,
    },
    {
      path: '/contributions/owed',
      name: 'owed',
      component: OwedView,
    },
    {
      path: '/bills',
      name: 'bills',
      component: PayPenView,
    },
    {
      path: '/users/not-paid',
      name: 'not-paid',
      component: NotContributionsView,
    },
    {
      path: '/users/late-contributions',
      name: 'late-contributions',
      component: LateContributions,
    },
    {
      path: '/users/late-checkin',
      name: 'late-checkin',
      component: LateListView,
    },
    {
      path: '/expenses',
      name: 'expenses',
      component: ExpenseView,
      meta: { requiresAuth: true },
    },
    {
      path: '/approvals',
      name: 'approvals',
      component: ApprovingView,
      meta: { requiresAuth: true },
    },
    {
      path: '/funds',
      name: 'funds',
      component: FundView,
      meta: { requiresAdmin: true },
    },
    {
      path: '/periods',
      name: 'periods',
      component: PeriodView,
      meta: { requiresAdmin: true },
    },
    {
      path: '/logs',
      name: 'logs',
      component: TransactionView,
      meta: { requiresAuth: true },
    },
    {
      path: '/reminders',
      name: 'reminders',
      component: ReminderView,
    },
    {
      path: '/penalties',
      name: 'penalties',
      component: PenaltyView,
      meta: { requiresAdmin: true },
    },
    {
      path: '/users',
      name: 'users',
      component: UserView,
      meta: { requiresAdmin: true },
    },
    {
      path: '/stats',
      name: 'stats',
      component: StatsView,
      meta: { requiresAdmin: true },
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
    console.error('Lỗi khi kiểm tra quyền admin:', error)
    return false
  }
}

// Middleware kiểm tra quyền truy cập trước khi vào trang
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('accessToken')
  const isAuthenticated = !!token

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'login' }) // Nếu chưa đăng nhập, chuyển đến login
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
