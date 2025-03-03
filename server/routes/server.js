
const routerPost = require('./post')
const routerUser = require('./auth')


const routerMain = (app) => {


    app.use('/api/ytopic/v1/post', routerPost)
    app.use('/api/ytopic/auth', routerUser)
    app.use('/v1/auth/google', routerUser)

}
module.exports = routerMain
