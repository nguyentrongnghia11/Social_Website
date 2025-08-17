import { Router } from 'express'
import { addMember, createGroup } from '../controller/groupController'
import { authenticateMiddleware } from '../middleware/verifyToken_services'

const router = Router()

router.post('/create', authenticateMiddleware, createGroup)
router.patch('/addMember', authenticateMiddleware, addMember)


export default router