
import { useEffect, useState } from 'react'
import styles from './MyPost.module.scss'
import classNames from 'classnames/bind'
import instance from '~/Fetch/instance'
import Menu from '~/components/Layout/DefaultLayout/Sidebar/Menu/Menu'
import MenuItem from '~/components/Layout/DefaultLayout/Sidebar/Menu/MenuItem'
import PostItem from '../Post/PostItem'
const cx = classNames.bind(styles)




export default function MyPost() {

    const [data, setData] = useState([])

    useEffect(() => {
        instance.get('/api/ytopic/v1/post/mypost', {
            withCredentials: true,
        }).then((res) => {
            console.log(res)
            setData(res.data.data)
        }).catch((err) => {
            console.log(err)
        })

    })



    return (

        <div>
            {data.map((item, index) => {
                return <PostItem {...item} key={index} ></PostItem>

            })}
        </div>
    )
}