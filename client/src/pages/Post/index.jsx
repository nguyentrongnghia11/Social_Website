import styles from './post.module.scss'
import { useEffect, useState } from 'react'

import classNames from 'classnames/bind'
import { Link } from 'react-router-dom'
import PostItem from './PostItem'
import instance from '~/Fetch/instance'



const cx = classNames.bind(styles)




export default (function Post() {

    const [data, setData] = useState([])

    useEffect(() => {

        instance.get('/api/ytopic/v1/post/all', {
            withCredentials: true,
        }).then((response) => {

            console.log('day la data ', response)
            //setData(data.data.data)
        }).catch((err) => {
            console.log('day la loi ', err.status)

            if (err.status === 401) {
                alert('Vui long dang nhap')
            }
            else {
                console.log('loi khac 36', + err)
            }
        })
    }, [])





    return (
        <div className={cx("wrapper")}>
            <div className="header">
                <h2>Chat for free</h2>

                <div className={cx("header-content")}>
                    <Link to='/'>
                        Trở về trang chủ
                    </Link>
                    <h3>Bài viết mới</h3>
                </div>   </div>

            <div className="container-post">
                {data.map((o, key) => {
                    return <PostItem {...o} key={key}></PostItem>
                })}
            </div>
        </div>
    )
})