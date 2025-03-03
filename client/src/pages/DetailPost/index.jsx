import PostDetail from "~/components/PostDetail";
import Comment from "~/components/Comment";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Lightbox from "react-image-lightbox";
import "react-image-lightbox/style.css";

import classNames from "classnames/bind";
import styles from "./DetailPost.module.scss";
const cx = classNames.bind(styles);

export default function DetailPost() {
    const location = useLocation();
    const post = location.state?.props;

    const [comment, setComment] = useState(['1', '2', '3', '4', '5']);
    const [state, setState] = useState({});
    const [image, setImage] = useState([
        "https://picsum.photos/200/300",
        "https://picsum.photos/200/301",
        "https://picsum.photos/200/302",
        "https://picsum.photos/200/303"
    ]);


    const [isOpen, setIsOpen] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);


    useEffect(() => {
        if (post) {
            console.log ("post", post);
            setState(post);
            //setComment(post.comments || []);
        }
    }, [post]);

    return (
        <div>
            <h1>Detail Post</h1>

            <div className={cx("wrapper")}>
                <h3 className="title">
                    Trải nghiệm máy chơi game Zotac Gaming Zone với thiết kế hiện đại, hiệu năng chơi game mạnh mẽ
                </h3>
                <div className={cx("info")}>
                    <img className="avt" src={post?.artistId?.avatar || "https://picsum.photos/200/300"} alt="" />
                    <div className="sub-info">
                        <div className={cx("name")}>{post?.artistId?.name || "Ẩn danh"}</div>
                        <div className={cx("data")}>Ngày đăng: {post?.createdAt}</div>
                    </div>
                </div>

                <div className={cx("content")}>
                    <div className={cx("article")}>{post?.content || "Nội dung bài viếtNội dung bài viếtNội dung bài viếtNội dung bài viếtNội dung bài viếtNội dung bài viếtNội dung bài viếtNội dung bài viếtNội dung bài viết"}</div>

                    {image.map((item, index) =>
                        item.match(/\.(mp3|wav|ogg)$/) ? (
                            <audio key={index} controls>
                                <source src={item} type={`audio/${item.split(".").pop()}`} />
                                Trình duyệt không hỗ trợ audio.
                            </audio>
                        ) : (

                            <img className={cx("img")}
                                key={index}
                                src={item}
                                alt=""
                                style={{ width: "200px", cursor: "pointer", margin: "10px" }}
                                onClick={() => {
                                    setPhotoIndex(index);
                                    setIsOpen(true);
                                }}
                            />

                        )
                    )}

                    {/*  Lightbox khi nhấn vào ảnh */}
                    {isOpen && (
                        <Lightbox
                            mainSrc={image[photoIndex]}
                            nextSrc={image[(photoIndex + 1) % image.length]}
                            prevSrc={image[(photoIndex + image.length - 1) % image.length]}
                            onCloseRequest={() => setIsOpen(false)}
                            onMovePrevRequest={() =>
                                setPhotoIndex((photoIndex + image.length - 1) % image.length)
                            }
                            onMoveNextRequest={() =>
                                setPhotoIndex((photoIndex + 1) % image.length)
                            }
                        />
                    )}

                    <div className={cx("react")}>trong nghia và 9 người khác</div>
                </div>
            </div>

            {comment.map((item, index) => {
                return <Comment key={index} data={item} />
            })}
        </div>
    );
}
