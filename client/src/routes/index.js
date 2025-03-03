

import Home from "~/pages/Home";
import Post from "~/pages/Post";
import Create from "~/pages/CreatePost/Create";
import Register from "~/pages/Register";
import OnlyHeader from "~/components/Layout/OnlyHeader";
import Verify from "~/pages/Verify";
import ManagerPost from "~/pages/ManagerPost";
import MyPost from "~/pages/MyPost";
import DetailPost from "~/pages/DetailPost";



const publicRoutes = [{ path: '/', element: Home }, { path: '/post', element: Post }, { path: '/create', element: Create },
{ path: '/register', element: Register, layout: OnlyHeader }, { path: '/post', element: Post }
    , { path: '/mypost', element: MyPost },
{ path: '/manager', element: ManagerPost }, { path: '/detail', element: DetailPost }]
const privateRoutes = []

export { publicRoutes, privateRoutes }