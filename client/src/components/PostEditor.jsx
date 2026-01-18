"use client"

import { Button, Card, Stack, TextField, Typography, Box as MuiBox, Chip, Snackbar, Alert } from "@mui/material"
import { useState, useRef, useSyncExternalStore } from "react"
import { useNavigate } from "react-router-dom"
import { PhotoCamera, Videocam, Delete as DeleteIcon, CloudUpload } from "@mui/icons-material"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import { createPost, grantPermissionUpload, postFile, saveMedia } from "../api-axios/posts."
import ErrorAlert from "./ErrorAlert"
import { isLoggedIn } from "../helpers/authHelper"
import HorizontalStack from "./util/HorizontalStack"
import UserAvatar from "./UserAvatar"
import axios from "axios"
import { LinearProgress } from "@mui/material"

const PostEditor = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const quillRef = useRef(null)

  const [progress, setTotalProgress] = useState(0)
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    title: "",
    content: ""
  })

  const formDataRef = useRef(new FormData());
  const [mediaFiles, setMediaFiles] = useState({
    images: [],
    videos: [],
  })

  const handleGrantPermissionUpload = async (e) => {
    e.preventDefault(); 

    if (uploading) return;
    setUploading(true);
    setServerError(""); 

    try {
      const result = await grantPermissionUpload({ ...formData, typeImg: "upload" });
      console.log("result ", result)
      if (!result) {
        console.log('23')
        return
      };
      let uploadedBytes = 0;
      formDataRef.current = new FormData();

      console.log("S3 upload data ", result)
      // Gộp cả ảnh và video
      const arrFile = [...mediaFiles.images, ...mediaFiles.videos];
      if (arrFile.length === 0) {
        setSnackbar({ 
          open: true, 
          message: 'Bài viết đã được tạo thành công!', 
          severity: 'success' 
        });
        
        setTimeout(() => {
          navigate("/");
        }, 1000);
        return;
      }
      
      const totalBytes = arrFile.reduce((acc, file) => acc + file.size, 0);
      
      // Gọi MỘT LẦN để lấy TẤT CẢ presigned URLs cùng lúc
      const filesInfo = arrFile.map(file => ({
        contentType: file.type,
        fileName: file.name,
        fileSize: file.size
      }));
      
      const uploadUrlsResult = await grantPermissionUpload({ 
        typeImg: "upload",
        postId: result.data.postId,
        files: filesInfo,
        title: formData.title,
        content: formData.content
      });
      
      console.log("Received batch presigned URLs:", uploadUrlsResult.data);
      
      const uploadPromises = arrFile.map(async (file, index) => {
        const uploadUrl = uploadUrlsResult.data.uploadUrls[index];
        
        console.log(`Uploading file ${index + 1}/${arrFile.length}:`, file.name)
        const response = await fetch(uploadUrl.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}: ${response.status} ${response.statusText}`);
        }

        uploadedBytes += file.size;
        const percent = Math.round((uploadedBytes / totalBytes) * 100);
        setTotalProgress(percent);

        return {
          key: uploadUrl.key,
          url: uploadUrl.uploadUrl.split('?')[0],
          resource_type: file.type.startsWith('video/') ? 'video' : 'image',
          format: file.name.split('.').pop(),
          bytes: file.size,
          type: file.type.startsWith('video/') ? 'video' : 'image'
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      console.log('Uploaded files to S3:', uploadedFiles)
      
      try {
        const res = await saveMedia(uploadedFiles, result.data.postId)
        console.log("Server updated:", res);
        
        // Show success notification
        setSnackbar({ 
          open: true, 
          message: 'Bài viết đã được tạo thành công!', 
          severity: 'success' 
        });
        
        // Navigate to home page after a short delay
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } catch (err) {
        console.error("Update server fail", err);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);
        console.error("Uploaded files that caused error:", uploadedFiles);
        setServerError(err.response?.data?.message || "Lưu thông tin file lên server thất bại!");
        setSnackbar({ 
          open: true, 
          message: err.response?.data?.message || 'Lưu thông tin file lên server thất bại!', 
          severity: 'error' 
        });
      }
    } catch (error) {
      setServerError("Upload fail !")
      setSnackbar({ 
        open: true, 
        message: 'Upload thất bại!', 
        severity: 'error' 
      });
    }
    finally {
      setLoading(false)
      setUploading(false)
    }
  };

  const [serverError, setServerError] = useState("")
  const [errors, setErrors] = useState({})
  const user = isLoggedIn()

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      [{ align: [] }],
      ["blockquote", "code-block"],
      ["link", "image", "video"],
      ["clean"],
    ],
    clipboard: {
      matchVisual: false,
    },
  }

  const quillFormats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "list",
    "bullet",
    "indent",
    "direction",
    "align",
    "blockquote",
    "code-block",
    "link",
    "image",
    "video",
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    const errors = validate()
    setErrors(errors)
  }

  const handleContentChange = (content) => {
    setFormData({ ...formData, content })
    const errors = validate()
    setErrors(errors)
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    setMediaFiles((prev) => ({
      ...prev,
      images: [...prev.images, ...imageFiles],
    }))
  }

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files || [])
    const videoFiles = files.filter((file) => file.type.startsWith("video/"))

    setMediaFiles((prev) => ({
      ...prev,
      videos: [...prev.videos, ...videoFiles],
    }))
  }

  const removeImage = (index) => {
    setMediaFiles((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const removeVideo = (index) => {
    setMediaFiles((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)

    // // Create FormData to handle file uploads
    // const submitData = new FormData()
    // submitData.append("title", formData.title)
    // submitData.append("content", formData.content)

    // // Add images
    // mediaFiles.images.forEach((image) => {
    //   submitData.append(`image`, image)
    // })

    // // Add videos
    // mediaFiles.videos.forEach((video) => {
    //   submitData.append(`video`, video)
    // })

    if (!isLoggedIn()) {
      navigate("/login")
    } else {
      try {
        const data = await postFile(formDataRef.current)
        setLoading(false)
        if (data && data.error) {
          setServerError(data.error)
        } else {
          navigate("/")
        }
      } catch (error) {
        setLoading(false)
        setServerError("An error occurred while creating the post")
      }
    }
  }

  const validate = () => {
    const errors = {}
    if (!formData.title.trim()) {
      errors.title = "Title is required"
    }
    if (!formData.content.trim() || formData.content === "<p><br></p>") {
      errors.content = "Content is required"
    }
    return errors
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        {user && (
          <HorizontalStack spacing={2}>
            <UserAvatar width={50} height={50} username={user.username} />
            <Typography variant="h5">What would you like to post today {user.username}?</Typography>
          </HorizontalStack>
        )}

        <Typography variant="body2" color="text.secondary">
          Use the rich text editor below to format your content with headers, bold text, lists, and more!
        </Typography>

        <MuiBox component="form" onSubmit={handleGrantPermissionUpload}>
          <TextField
            fullWidth
            label="Title"
            required
            name="title"
            margin="normal"
            onChange={handleChange}
            error={errors.title !== undefined}
            helperText={errors.title}
            value={formData.title}
          />

          {/* Rich Text Editor */}
          <MuiBox sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Content *
            </Typography>
            <MuiBox
              sx={{
                border: errors.content ? "2px solid #d32f2f" : "1px solid #c4c4c4",
                borderRadius: 1,
                "& .ql-editor": {
                  minHeight: "200px",
                  fontSize: "16px",
                  lineHeight: 1.6,
                },
                "& .ql-toolbar": {
                  borderBottom: "1px solid #c4c4c4",
                },
                "&:focus-within": {
                  borderColor: errors.content ? "#d32f2f" : "#1976d2",
                  borderWidth: "2px",
                },
              }}
            >
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your post content here... You can use formatting, add links, create lists, and more!"
              />
            </MuiBox>
            {errors.content && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                {errors.content}
              </Typography>
            )}
          </MuiBox>

          {/* Media Upload Section */}
          <MuiBox sx={{ mt: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add Media
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="image-upload"
                multiple
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload">
                <Button variant="outlined" component="span" startIcon={<PhotoCamera />} size="small">
                  Add Images
                </Button>
              </label>

              <input
                accept="video/*"
                style={{ display: "none" }}
                id="video-upload"
                multiple
                type="file"
                ref={videoInputRef}
                onChange={handleVideoUpload}
              />
              <label htmlFor="video-upload">
                <Button variant="outlined" component="span" startIcon={<Videocam />} size="small">
                  Add Videos
                </Button>
              </label>
            </Stack>

            {/* Display uploaded images */}
            {mediaFiles.images.length > 0 && (
              <MuiBox sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Images ({mediaFiles.images.length})
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {mediaFiles.images.map((image, index) => (
                    <Chip
                      key={index}
                      label={`${image.name} (${formatFileSize(image.size)})`}
                      onDelete={() => removeImage(index)}
                      deleteIcon={<DeleteIcon />}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </MuiBox>
            )}

            {/* Display uploaded videos */}
            {mediaFiles.videos.length > 0 && (
              <MuiBox sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Videos ({mediaFiles.videos.length})
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {mediaFiles.videos.map((video, index) => (
                    <Chip
                      key={index}
                      label={`${video.name} (${formatFileSize(video.size)})`}
                      onDelete={() => removeVideo(index)}
                      deleteIcon={<DeleteIcon />}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </MuiBox>
            )}
          </MuiBox>

          <ErrorAlert error={serverError} />

          {
            uploading && (
              <LinearProgress variant="determinate" value={progress} ></LinearProgress>
            )
          }

          <Button
            variant="contained"
            type="submit"
            fullWidth
            disabled={loading}
            startIcon={loading ? undefined : <CloudUpload />}
            sx={{ mt: 2 }}
          >
            {loading ? "Submitting..." : "Submit Post"}
          </Button>
        </MuiBox>
      </Stack>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}

export default PostEditor
