import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  LinearProgress,
  Chip,
} from "@mui/material";
import { Close, PhotoCamera, Videocam } from "@mui/icons-material";
import React, { useState, useRef } from "react";
import RichTextEditor from "./RichTextEditor";
import { grantPermissionUpload } from "../api-axios/posts.";

const ContentUpdateEditor = (props) => {
  const [content, setContent] = useState(props.originalContent);
  const [title, setTitle] = useState(props.originalTitle || "");

  // Chỉ quản lý file MỚI — ảnh hiện tại được quản lý bởi PostCard
  const [newFiles, setNewFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleContentChange = (value) => setContent(value);
  const handleTitleChange = (e) => setTitle(e.target.value);

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const handleAddVideos = (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("video/")
    );
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const handleRemoveNew = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (props.validate) {
      const err = props.validate(content);
      if (err && err.length !== 0) {
        setError(err);
        return;
      }
    }
    setError("");

    let uploadedNewFiles = [];

    if (newFiles.length > 0) {
      setUploading(true);
      setProgress(0);

      try {
        const filesInfo = newFiles.map((f) => ({
          contentType: f.type,
          fileName: f.name,
          fileSize: f.size,
        }));

        const result = await grantPermissionUpload({
          typeImg: "upload",
          postId: props.postId,
          files: filesInfo,
          title,
          content,
        });

        const { uploadUrls } = result.data;
        const totalBytes = newFiles.reduce((acc, f) => acc + f.size, 0);
        let uploadedBytes = 0;

        const uploadPromises = newFiles.map(async (file, index) => {
          const urlInfo = uploadUrls[index];
          const response = await fetch(urlInfo.uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": urlInfo.fileType },
          });

          if (!response.ok) {
            throw new Error(`Upload thất bại cho ${file.name}: ${response.status}`);
          }

          uploadedBytes += file.size;
          setProgress(Math.round((uploadedBytes / totalBytes) * 100));

          return {
            url: urlInfo.uploadUrl.split("?")[0],
            key: urlInfo.key,
            resource_type: file.type.startsWith("video/") ? "video" : "image",
            format: file.name.split(".").pop(),
            bytes: file.size,
          };
        });

        uploadedNewFiles = await Promise.all(uploadPromises);
      } catch (err) {
        console.error("Upload error:", err);
        setError("Upload thất bại: " + err.message);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const syntheticEvent = {
      ...e,
      preventDefault: () => {},
      stopPropagation: () => {},
      target: {
        ...e.target,
        title: { value: title },
        content: { value: content },
      },
    };

    // Chỉ truyền các file MỚI — PostCard tự merge với existingMedia
    props.handleSubmit(syntheticEvent, uploadedNewFiles);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {props.originalTitle !== undefined && (
          <TextField
            value={title}
            fullWidth
            margin="normal"
            name="title"
            label={props.titleLabel || "Tiêu đề"}
            onChange={handleTitleChange}
          />
        )}

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Nội dung
          </Typography>
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            placeholder="Nhập nội dung bài viết..."
            error={error.length !== 0}
            helperText={error}
            minHeight={200}
          />
        </Box>

        {/* Thêm file mới */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Thêm ảnh / video
          </Typography>
          <Stack direction="row" spacing={1}>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="edit-image-upload"
              multiple
              type="file"
              ref={imageInputRef}
              onChange={handleAddImages}
            />
            <label htmlFor="edit-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
                size="small"
                disabled={uploading}
              >
                Thêm ảnh
              </Button>
            </label>

            <input
              accept="video/*"
              style={{ display: "none" }}
              id="edit-video-upload"
              multiple
              type="file"
              ref={videoInputRef}
              onChange={handleAddVideos}
            />
            <label htmlFor="edit-video-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<Videocam />}
                size="small"
                disabled={uploading}
              >
                Thêm video
              </Button>
            </label>
          </Stack>

          {newFiles.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
              {newFiles.map((file, index) => (
                <Chip
                  key={index}
                  label={`${file.name} (${formatSize(file.size)})`}
                  onDelete={() => handleRemoveNew(index)}
                  deleteIcon={<Close />}
                  variant="outlined"
                  size="small"
                  color={file.type.startsWith("video/") ? "secondary" : "primary"}
                />
              ))}
            </Stack>
          )}
        </Box>

        {uploading && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Đang upload... {progress}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}

        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained" sx={{ flex: 1 }} disabled={uploading}>
            {uploading ? "Đang upload..." : "Cập nhật"}
          </Button>
          {props.onCancel && (
            <Button variant="outlined" onClick={props.onCancel} sx={{ flex: 1 }} disabled={uploading}>
              Hủy
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default ContentUpdateEditor;
