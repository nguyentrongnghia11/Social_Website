
import { useEffect, useState } from 'react'

import styles from './Home.module.scss'
import classNames from 'classnames/bind'
import PostItem from '../Post/PostItem'
import instance from '~/Fetch/instance'

const cx = classNames.bind(styles)

export default (
    function Home() {

        const [data, setData] = useState([{title: "hihi", artistId: {name: "haha"}, createdAt: "2021-09-01", comments: []}]);

        useEffect(() => {
            instance.get('/api/ytopic/v1/post/all', {
                withCredentials: true,
            }).then((response) => {

                console.log('day la data ', response)
                setData(response.data.data)
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
            <>
                <div className={cx("wrapper")}>
                    <div className={cx("box")}>

                    </div>
                    <div className="container-item">
                        {/* list item tai day */}

                        {data.map((item, key) => {
                            return <PostItem {...item} key={key}></PostItem>
                        })}
                    </div>
                </div>
            </>
        )
    })