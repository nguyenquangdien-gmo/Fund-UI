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
import StatsView from '@/views/StatsView.vue'
// import ContributionView from '@/views/ContributionView.vue'
// @ts-ignore// @ts-ignore
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/home',
      name: 'home',
      component: StatsView,
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
      path: '/funds',
      name: 'funs',
      component: FundView,
    },
    {
      path: '/periods',
      name: 'periods',
      component: PeriodView,
    },
    {
      path: '/penalties',
      name: 'penalties',
      component: PenaltyView,
    },
    {
      path: '/bills',
      name: 'bills',
      component: PayPenView,
    },
    {
      path: '/stats',
      name: 'stats',
      component: StatsView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFound.vue'),
    },

    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
