
import styles from './PostItem.module.scss'
import classNames from 'classnames/bind'
import logo from '../../../access/image/logo.jpg'
import Tippy from '@tippyjs/react/headless'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const cx = classNames.bind(styles)

const convertDate = (date) => {
    const d = new Date(date)

    return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

}

function PostItem(props) {

    const [visible, setVisible] = useState(false);
    // const hidden = () => { setVisible(false) }
    // const show = () => { setVisible(true) }


    const navigate = useNavigate();

    const handleClick = () => {
         navigate("/detail", { state: { props }}); 
        
    };

    return (
        <div className={cx("post-item")} >


            <div className={cx("information-left")} onClick={handleClick}>
                <div className={cx("avt")}>
                    <img src={logo} alt="img" style={{ objectFit: "contain" }} />
                </div>

                <div className={cx("infor-top")} >
                    <div className={cx("infor-item")}>
                        <div className={cx("name")} style={{ marginRight: "15px" }}>Ảnh và video</div>
                        <Link className={cx("title")} >{props.title}</Link>
                    </div>
                    <div className={cx("infor-item")}>
                        <div className={cx("title")} style={{ marginRight: "15px" }}>{props.artistId ? props.artistId.name : "No name"}</div>
                        <div className={cx("content")} >{convertDate(props.createdAt)}</div>
                    </div>
                </div>

            </div>

            <div className="information-right">

                <div className="infor-bot">
                    {`${props.comments.length} bình luận`}
                </div>


                <Tippy
                    placement='right'
                    interactive
                    visible={visible}
                    onClickOutside={() => setVisible(false)}
                    render={(attrs) => (
                        <div className="menu" tabIndex="-1" {...attrs}>
                            <Link to={"/post"} className={cx("link")}>Báo cáo vi phạm</Link>
                            <Link to={"/create"} state={props} className={cx("link")} onClick={() => {
                                console.log('click ', props)
                            }}>Chỉnh sửa bài viết</Link>
                            <Link to={"/post"} className={cx("link")}>Xóa bài viết</Link>
                        </div>
                    )}
                >
                    <div className={cx("three-point")} onClick={() => setVisible(!visible)}>
                        ...
                    </div>
                </Tippy>


            </div>

        </div>
    )
}

export default PostItem