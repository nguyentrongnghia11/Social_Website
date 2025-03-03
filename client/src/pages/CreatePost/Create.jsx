import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import 'react-quill'
import styles from "./Create.module.scss";
import classNames from "classnames/bind";
import instance from "~/Fetch/instance";
import { useLocation } from "react-router-dom";

const cx = classNames.bind(styles);

function Create() {
    console.log("Create Post");

    const location = useLocation();

    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [imgUrl, setImgUrl] = useState("");
    const [fileUpload, setFileUpload] = useState(null);
    const quillRef = useRef(null); // Dùng useRef để lấy instance của Quill



    // useEffect(() => {
    //     if (quillRef.current) {
    //         const quill = quillRef.current.getEditor();
    //         quill.getModule("toolbar").addHandler("image", ImageUploader);
    //     }
    // }, []);

    function createPost() {
        console.log(fileUpload);

        instance.post(
            "http://localhost:3000/api/ytopic/v1/post/", { image: fileUpload, content: content, title: title }, {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" }
        }
        ).then((response) => console.log("Upload thành công!", response.data))
            .catch((error) => console.error("Lỗi khi upload:", error));


    }

    useEffect(() => {
        if (!location.state) return;

        const post = location.state;
        setImgUrl(post.imgUrl)
        console.log("Nhận được post: ", 22);

        if (post.imgUrl && quillRef.current) {
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection();
            console.log(post.content);

            const length = quill.getLength();

            quill.clipboard.dangerouslyPasteHTML(post.content);
            quill.insertEmbed(length, 'image', imgUrl);

        }
    });



    function ImageUploader() {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();

        input.onchange = async () => {
            if (!input.files.length) return;

            const file = input.files[0];
            console.log("File đã chọn:", file);
            setFileUpload(file);

            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = () => {
                const url = reader.result;
                const quill = quillRef.current.getEditor(); // Lấy Quill instance
                const range = quill.getSelection(); // Lấy vị trí con trỏ trong editor

                if (range && range.index !== undefined) {
                    quill.insertEmbed(range.index, "image", url);
                } else {

                    quill.insertEmbed(quill.getLength(), "image", url); // Chèn vào cuối nếu không có range
                }
            };
        };
    }
    const handleChange = (value) => {
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            const text = quill.getText(); // Lấy văn bản từ Quill editor
            console.log(text); // Log nội dung để kiểm tra

            setContent(text); // Cập nhật nội dung vào state
        }
    };


    const modules = {
        toolbar: {
            container: [
                [{ header: [1, 2, false] }],
                ["bold", "italic", "underline", "strike", "blockquote"],
                [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
                ["link", "image"],
                ["clean"],
            ],
        },
        clipboard: { matchVisual: false },
    };

    const formats = ["header", "bold", "italic", "underline", "strike", "blockquote", "list", "indent", "link", "image"];

    return (
        <>
            <div className={cx("input-title")}>
                <select name="" id="" className={cx("tag")}>
                    <option value="1">Ảnh</option>
                    <option value="2">Video</option>
                    <option value="3">Ảnh và Video</option>
                    <option value="4">Không tag</option>
                </select>
                <input className={cx("text")} onChange={(e) => { console.log(title); setTitle(e.target.value) }} />
            </div>

            <ReactQuill ref={quillRef} theme="snow" className={cx("quill-editor")} value={content} onChange={handleChange} modules={modules} formats={formats} />

            <div className={cx("btn-post")}>
                <button type="button" className="btn btn-success" onClick={createPost} style={{ display: "block", margin: "auto" }}>
                    Đăng bài viết
                </button>
                <button type="button" className="btn btn-success" onClick={createPost} style={{ display: "block", margin: "auto" }}>
                    Cập nhật bài viết
                </button>
            </div>
        </>
    );
}

export default Create;
