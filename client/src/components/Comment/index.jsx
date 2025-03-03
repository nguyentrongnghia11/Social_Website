
import { useEffect, useRef, useState } from 'react'
import styles from './Comment.module.scss'
import classNames from 'classnames/bind'
import EmojiPicker from "emoji-picker-react";
import InputEmoji from "react-input-emoji";

const cx = classNames.bind(styles)


export default function Comment(props) {

    const [hidden, setHidden] = useState(true)
    const [comment, setComment] = useState("");

    const [text, setText] = useState("");



    const addEmoji = (emojiObject) => {
        setComment(comment + emojiObject.emoji);
    };

    const handleReply = () => {
        if (hidden == true) {
            setHidden(false)
        }
        else {
            setHidden(true)
        }
    }

    console.log('day la propps ', props)
    return (
        <div className={cx("wrapper")}>
            <div className={cx("info")}>
                <img src="" alt="" />
            </div>
            <div className="content">

                <div className={cx("sub-content")}>
                    <div className="name">Hoanf chau</div>
                    <div className={cx("article")}>Bai viet cua thang naysdfsfdhsdfhdslfhsdfhlsdlhsdfsdfsdfsdfdsffd nhu con cac luon</div>
                </div>
                <div className={cx("react")}>

                    <div className={cx("sub-react")}>
                        <div className={cx("like")}>Thích</div>
                        <div className={cx("comment")} onClick={handleReply}>Trả lời</div>
                    </div>
                    <div className={cx("data")}>15/01/2004</div>
                </div>

                <div className={cx("box-comment")} hidden={hidden}>
                    <InputEmoji value={text} onChange={setText} placeholder="Viết bình luận..." />
                    <label htmlFor="fileInput">
                        <i class={cx("fa-solid", "fa-file", "fa-xl")} type="file" accept="image/*" style={{ marginRight: "10px", color: "#858585" }}></i>

                    </label>
                    <label htmlFor="fileInput">

                        <i class={cx("fa-solid", "fa-image", "fa-xl")} type="file" accept="image/gif " style={{ color: "#858585" }}></i>
                    </label>

                    <input id="fileInput" type="file" accept="*" style={{ display: "none" }} />
                    <input id="imageInput" type="file" accept="image/*" style={{ display: "none" }} />
                </div>

            </div>
        </div>
    )
}