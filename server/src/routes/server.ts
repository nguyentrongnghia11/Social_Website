
import routerPost from './post'
import routerUser from './auth'
import routerComment from './comment'
import routerConversation from './conversations'
import routerNotification from './notification'
import routerGroup from './group'
import { limiter } from '../middleware/checkRatelimt'
import { slowdown } from '../middleware/slowdown'



const routerMain = (app: any) => {

    app.use('/api/auth', limiter, routerUser)
    app.use('/v1/auth/google', routerUser)

    app.use('/api', slowdown)

    app.use('/api/post', routerPost)
    app.use('/api/comment', routerComment)
    app.use('/api/conversation', routerConversation)
    app.use('/api/group', routerGroup)

    app.use('/api/notification', routerNotification)

}
export default routerMain
