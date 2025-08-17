
import routerPost from './post'
import routerUser from './auth'
import routerComment from './comment'
import routerConversation from './conversations'
import routerNotification from './notification'
import routerGroup from './group'


const routerMain = (app: any) => {


    app.use('/api/post', routerPost)
    app.use('/api/comment', routerComment)
    app.use('/api/auth', routerUser)
    app.use('/api/conversation', routerConversation)
    app.use('/v1/auth/google', routerUser)
    app.use('/api/notification', routerNotification)
    app.use('/api/group', routerGroup)

}
module.exports = routerMain
