
import routerPost from './post'
import routerUser from './auth'
import routerComment from './comment'
import routerConversation from './conversations'
import routerNotification from './notification'
import routerGroup from './group'
import routerCall from './call'
import routerAdmin from './admin'
import routerBanner from './banner'
import { limiter } from '../middleware/checkRatelimt'
import { slowdown } from '../middleware/slowdown'



const routerMain = (app: any) => {

    app.use('/api/auth', limiter, routerUser)
    app.use('/', routerUser)

    app.use('/api', slowdown)

    app.use('/api/post', routerPost)
    app.use('/api/comment', routerComment)
    app.use('/api/conversations', routerConversation)
    app.use('/api/group', routerGroup)
    app.use('/api/call', routerCall)

    app.use('/api/notifications', routerNotification)

    // Public banner route
    app.use('/api', routerBanner)

    // Admin routes
    app.use('/api/admin', routerAdmin)

}
export default routerMain
