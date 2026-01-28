import { Button, Card, Stack, TextField, Typography, Box, IconButton, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createComment } from "../api-axios/posts.";
import { uploadCommentImage } from "../api-axios/comment";
import { isLoggedIn } from "../helpers/authHelper";
import ErrorAlert from "./ErrorAlert";
import HorizontalStack from "./util/HorizontalStack";
import { Image as ImageIcon, Close } from "@mui/icons-material";

const CommentEditor = ({ label, comment, addComment, setReplying }) => {
  const [formData, setFormData] = useState({
    content: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const params = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = null;

    // Upload image if selected
    if (selectedImage) {
      setUploading(true);
      try {
        const uploadRes = await uploadCommentImage(selectedImage);
        imageUrl = uploadRes.data.data.url;
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi upload ảnh');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const body = {
      ...formData,
      parentID: comment && comment._id,
      imageUrl,
    };

    setLoading(true);
    const data = await createComment(body, params.id);
    setLoading(false);

    if (data.status != 200) {
      setError(data.error);
    } else {
      formData.content = "";
      setSelectedImage(null);
      setImagePreview(null);
      setReplying && setReplying(false);

      addComment(data.result);
    }
  };

  const handleFocus = (e) => {
    // !isLoggedIn() && navigate("/login");
  };

  return (
    <Card>
      <Stack spacing={2}>
        <HorizontalStack justifyContent="space-between">
          <Typography variant="h5">
            {comment ? <>Reply</> : <>Comment</>}
          </Typography>
          <Typography>
            <a href="https://commonmark.org/help/" target="_blank">
              Markdown Help
            </a>
          </Typography>
        </HorizontalStack>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            multiline
            fullWidth
            label={label}
            rows={5}
            required
            name="content"
            sx={{
              backgroundColor: "white",
            }}
            onChange={handleChange}
            onFocus={handleFocus}
            value={formData.content}
          />

          {/* Image Upload Section */}
          <Box sx={{ mt: 2 }}>
            <Button
              component="label"
              startIcon={<ImageIcon />}
              variant="outlined"
              size="small"
            >
              Đính kèm ảnh
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>

            {imagePreview && (
              <Box
                sx={{
                  mt: 2,
                  position: 'relative',
                  width: 'fit-content',
                  maxWidth: '100%'
                }}
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    width: 200,
                    height: 'auto',
                    borderRadius: 8,
                    display: 'block',
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleRemoveImage}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>

          <ErrorAlert error={error} sx={{ my: 4 }} />
          <Button
            variant="outlined"
            type="submit"
            fullWidth
            disabled={loading || uploading}
            sx={{
              backgroundColor: "white",
              mt: 2,
            }}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading ? <div>Đang tải ảnh...</div> : loading ? <div>Submitting</div> : <div>Submit</div>}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
};

export default CommentEditor;
