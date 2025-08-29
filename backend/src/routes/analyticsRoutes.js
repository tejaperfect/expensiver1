import express from 'express'
import {
  getDashboardAnalytics,
  getSpendingPatterns,
  getBudgetAnalysis,
  getGroupAnalytics,
  getFinancialReport,
  getExpenseInsights
} from '../controllers/analyticsController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Routes
router.get('/dashboard', getDashboardAnalytics)
router.get('/spending-patterns', getSpendingPatterns)
router.get('/budget-analysis', getBudgetAnalysis)
router.get('/insights', getExpenseInsights)
router.get('/reports', getFinancialReport)
router.get('/groups/:groupId', getGroupAnalytics)

export default router