import { Box, Button, Stack, TextField, IconButton, Typography, ImageList, ImageListItem, ImageListItemBar } from "@mui/material";
import { Close } from "@mui/icons-material";
import React, { useState } from "react";
import RichTextEditor from "./RichTextEditor";

const ContentUpdateEditor = (props) => {
  const [content, setContent] = useState(props.originalContent);
  const [title, setTitle] = useState(props.originalTitle || "");
  const [files, setFiles] = useState(props.originalFiles || []);
  const [error, setError] = useState("");

  // Helper to get URL from file object or string
  const getFileUrl = (file) => {
    if (typeof file === 'string') return file;
    if (file?.secure_url) return file.secure_url;
    return file;
  };

  const handleContentChange = (value) => {
    setContent(value);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const isVideoFile = (file) => {
    const url = getFileUrl(file);
    return url?.match(/\.(mp4|webm|ogg|mov)$/i) || file?.resource_type === 'video';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log (content, title, files)
    let error = null;

    if (props.validate) {
      error = props.validate(content);
    }

    if (error && error.length !== 0) {
      setError(error);
    } else {
      // Tạo một event giả với title và content
      const syntheticEvent = {
        ...e,
        preventDefault: () => {},
        stopPropagation: () => {},
        target: {
          ...e.target,
          title: { value: title },
          content: { value: content }
        }
      };
      props.handleSubmit(syntheticEvent, files);
    }
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
            label="Tiêu đề"
            sx={{ backgroundColor: "white" }}
            onChange={handleTitleChange}
          />
        )}
        
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Nội dung</Typography>
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            placeholder="Nhập nội dung bài viết..."
            error={error.length !== 0}
            helperText={error}
            minHeight={200}
          />
        </Box>
        
        {files && files.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Tệp đính kèm (Hình ảnh & Video)</Typography>
            <ImageList sx={{ width: '100%', maxHeight: 300 }} cols={3} rowHeight={150}>
              {files.map((file, index) => (
                <ImageListItem key={index}>
                  {isVideoFile(file) ? (
                    <video
                      src={getFileUrl(file)}
                      style={{ objectFit: 'cover', height: '150px', width: '100%' }}
                      controls={false}
                    />
                  ) : (
                    <img
                      src={getFileUrl(file)}
                      alt={`File ${index + 1}`}
                      loading="lazy"
                      style={{ objectFit: 'cover', height: '150px' }}
                    />
                  )}
                  <ImageListItemBar
                    sx={{
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
                    }}
                    position="top"
                    actionIcon={
                      <IconButton
                        sx={{ color: 'white' }}
                        onClick={() => handleRemoveFile(index)}
                        size="small"
                      >
                        <Close />
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}

        <Stack direction="row" spacing={2}>
          <Button
            type="submit"
            variant="contained"
            sx={{ flex: 1 }}
          >
            Cập nhật
          </Button>
          {props.onCancel && (
            <Button
              variant="outlined"
              onClick={props.onCancel}
              sx={{ flex: 1 }}
            >
              Hủy
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default ContentUpdateEditor;
