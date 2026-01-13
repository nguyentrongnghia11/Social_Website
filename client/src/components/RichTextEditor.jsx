"use client"

import { useRef, useMemo, useState, useEffect } from "react"
import { Box, Typography } from "@mui/material"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"


const RichTextEditor = ({
    value,
    onChange,
    placeholder = "Start writing...",
    error = false,
    helperText,
    minHeight = 200,
}) => {
    const quillRef = useRef(null)
    const [isClient, setIsClient] = useState(false)

    // Đảm bảo chỉ render trên client side
    useEffect(() => {
        setIsClient(true)
    }, [])

    const modules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ color: [] }, { background: [] }],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ indent: "-1" }, { indent: "+1" }],
                    [{ align: [] }],
                    ["blockquote", "code-block"],
                    ["link", "image"],
                    ["clean"],
                ],
            },
            clipboard: {
                matchVisual: false,
            },
        }),
        [],
    )

    const formats = [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "color",
        "background",
        "list",
        "bullet",
        "indent",
        "align",
        "blockquote",
        "code-block",
        "link",
        "image",
    ]

    // Loading state khi chưa mount trên client
    if (!isClient) {
        return (
            <Box>
                <Box
                    sx={{
                        height: minHeight,
                        border: error ? "2px solid #d32f2f" : "1px solid #c4c4c4",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.secondary",
                        backgroundColor: "#f5f5f5",
                    }}
                >
                    Loading editor...
                </Box>
                {helperText && (
                    <Typography variant="caption" color={error ? "error" : "text.secondary"} sx={{ mt: 1, display: "block" }}>
                        {helperText}
                    </Typography>
                )}
            </Box>
        )
    }

    return (
        <Box>
            <Box
                sx={{
                    border: error ? "2px solid #d32f2f" : "1px solid #c4c4c4",
                    borderRadius: 1,
                    "& .ql-editor": {
                        minHeight: `${minHeight}px`,
                        fontSize: "16px",
                        lineHeight: 1.6,
                        fontFamily: "inherit",
                    },
                    "& .ql-toolbar": {
                        borderBottom: "1px solid #c4c4c4",
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                    },
                    "& .ql-container": {
                        borderBottomLeftRadius: 4,
                        borderBottomRightRadius: 4,
                    },
                    "&:focus-within": {
                        borderColor: error ? "#d32f2f" : "#1976d2",
                        borderWidth: "2px",
                    },
                    "& .ql-editor.ql-blank::before": {
                        color: "#999",
                        fontStyle: "normal",
                    },
                }}
            >
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                />
            </Box>
            {helperText && (
                <Typography variant="caption" color={error ? "error" : "text.secondary"} sx={{ mt: 1, display: "block" }}>
                    {helperText}
                </Typography>
            )}
        </Box>
    )
}

export default RichTextEditor
