import { Router } from 'express'
import { addMember, createGroup } from '../controller/groupController'
import { authenticateMiddleware } from '../middleware/verifyToken'
import { validateCreateGroup } from '../validations/validation'

const router = Router()

router.post('/create', authenticateMiddleware,validateCreateGroup , createGroup)
router.patch('/addMember', authenticateMiddleware, addMember)


export default router