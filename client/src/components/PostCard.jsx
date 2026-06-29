"use client"

import {
  Card,
  IconButton,
  Stack,
  Typography,
  useTheme,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
} from "@mui/material"
import { Box } from "@mui/system"
import React, { useState, useCallback, useMemo } from "react"
import { AiFillCheckCircle, AiFillEdit, AiFillMessage } from "react-icons/ai"
import { useNavigate } from "react-router-dom"
import { deletePost, updatePost, likePost, hidePost, unhidePost } from "../api-axios/posts."
import { isLoggedIn } from "../helpers/authHelper"
import ContentDetails from "./ContentDetails"
import LikeBox from "./LikeBox"
import PostContentBox from "./PostContentBox"
import HorizontalStack from "./util/HorizontalStack"
import ContentUpdateEditor from "./ContentUpdateEditor"
import "./postCard.css"
import { MdCancel, MdVisibility, MdVisibilityOff } from "react-icons/md"
import { BiTrash } from "react-icons/bi"
import UserLikePreview from "./UserLikePreview"
import { ZoomIn, Close, ExpandMore, MoreVert } from "@mui/icons-material"
import HTMLContent from "./HTMLContent"
import ImageLightbox from "./ImageLightbox"

const PostCard = (props) => {
  const { preview, removePost } = props
  const postData = props.post

  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const user = isLoggedIn()
  const isAuthor = user && (
    user.user._id === postData.author?._id
  );

  const isAdmin = user && (user.isAdmin || user.user?.isAdmin);
  const isModerator = user && (user.user?.role === 'admin' || user.user?.role === 'moderator' || user.user?.permissions?.includes('manage_content'));

  const theme = useTheme()
  const iconColor = theme.palette.primary.main
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [post, setPost] = useState(postData)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [liked, setLiked] = useState(post.liked || false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const menuOpen = Boolean(menuAnchorEl)
  const [expanded, setExpanded] = useState(false)
  const [failedImageUrls, setFailedImageUrls] = useState(new Set())
  // Media state khi đang edit — track những ảnh/video còn giữ lại
  const [editingMedia, setEditingMedia] = useState([])
  const isPreviewMode = preview === "primary" || preview === "secondary"
  const isCompactPreview = preview === "secondary"
  const isDetailPage = !preview || !isPreviewMode

  const cardSizing = useMemo(() => ({
    padding: isCompactPreview ? 0.5 : isPreviewMode ? 1 : 2,
    likeBoxWidth: isCompactPreview ? 35 : isPreviewMode ? 40 : 50,
    titleVariant: isCompactPreview ? "subtitle1" : isPreviewMode ? "h6" : "h5",
    titleMaxHeight: isCompactPreview ? 60 : isPreviewMode ? 80 : 125,
    contentMaxHeight: isCompactPreview ? 100 : isPreviewMode ? 150 : expanded ? null : 200,
    spacing: isCompactPreview ? 0.5 : isPreviewMode ? 1 : 2,
  }), [isCompactPreview, isPreviewMode, expanded])

  const maxHeight = useMemo(() => preview === "primary" ? 250 : null, [preview])

  const handleDeletePost = useCallback(async (e) => {
    e.stopPropagation()
    if (!confirm) {
      setConfirm(true)
    } else {
      setLoading(true)
      await deletePost(post._id, isLoggedIn())
      setLoading(false)
      preview ? removePost(post) : navigate("/")
    }
  }, [confirm, post._id, preview, removePost, navigate])

  const handleEditPost = useCallback((e) => {
    e.stopPropagation()
    if (!editing) {
      // Khởi tạo editingMedia từ media hiện tại của post
      setEditingMedia(post.media || [])
    }
    setEditing(!editing)
  }, [editing, post.media])

  const handleRemoveEditingMedia = useCallback((index) => {
    setEditingMedia((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(async (e, newlyUploadedFiles) => {
    e.preventDefault()
    const content = e.target.content.value
    const title = e.target.title.value || post.title
    // existingMedia (đã lọc qua X) + file mới upload từ ContentUpdateEditor
    const files = [...editingMedia, ...(newlyUploadedFiles || [])];

    const updateData = {
      content,
      title,
      files: files
    }

    console.log('Submitting update with files:', files);

    try {
      const response = await updatePost(post._id, isLoggedIn(), updateData);
      console.log('Update response:', response);
      if (response?.data) {
        setPost(response.data);
        setLikeCount(response.data.likeCount || post.likeCount);
        setLiked(response.data.liked || post.liked);
      } else {
        setPost({ ...post, ...updateData, edited: true });
      }
      setEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Không thể cập nhật bài viết. Vui lòng thử lại!');
    }
  }, [post, editingMedia])

  const handleLikee = useCallback(async (isLiked) => {
    if (!isLoggedIn()) return navigate("/login")
    setLiked(isLiked)
    setLikeCount(likeCount + (isLiked ? 1 : -1))
    await likePost(post._id, isLiked ? user : null)
  }, [likeCount, post._id, user, navigate])

  const handleImageClick = useCallback((imageUrl) => {
    setSelectedImage(imageUrl)
    setImageDialogOpen(true)
  }, [])

  const handleCloseImageDialog = useCallback(() => {
    setImageDialogOpen(false)
    setSelectedImage(null)
  }, [])

  const handleToggleExpand = useCallback((e) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }, [expanded])

  const handleMenuOpen = useCallback((e) => {
    e.stopPropagation()
    setMenuAnchorEl(e.currentTarget)
  }, [])

  const handleMenuClose = useCallback((e) => {
    if (e) e.stopPropagation()
    setMenuAnchorEl(null)
  }, [])

  const handleToggleHide = useCallback(async (e) => {
    e.stopPropagation()
    handleMenuClose()
    setLoading(true)
    try {
      if (post.deleted) {
        await unhidePost(post._id)
        setPost({ ...post, deleted: false })
      } else {
        await hidePost(post._id)
        setPost({ ...post, deleted: true })
      }
    } catch (error) {
      console.error(error)
      alert('Có lỗi xảy ra khi thay đổi trạng thái bài viết')
    }
    setLoading(false)
  }, [post])

  const renderImages = () => {
    // Khi đang edit: hiển thị từ editingMedia (ảnh type image), khi không edit: từ imgUrl
    const imagesToShow = editing
      ? editingMedia.filter((m) => m.resource_type === 'image')
      : (post.imgUrl || [])

    if (imagesToShow.length === 0 || !isDetailPage) return null

    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Hình ảnh ({imagesToShow.length})
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          {imagesToShow.map((item, index) => {
            const imageUrl = editing ? (item.url || item.secure_url || '') : item
            const hasError = failedImageUrls.has(imageUrl)
            // index trong editingMedia (chỉ ảnh) cần map sang index trong editingMedia gốc
            const mediaIndex = editing
              ? editingMedia.findIndex((m) => m === item)
              : index

            return (
              <Box
                key={index}
                sx={{
                  position: "relative",
                  cursor: editing ? "default" : "pointer",
                  borderRadius: 2,
                  overflow: "hidden",
                  width: "fit-content",
                  maxWidth: "300px",
                  display: "flex",
                  justifyContent: "flex-start",
                  ...(!editing && {
                    "&:hover .image-overlay": { opacity: 1 },
                    "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
                  }),
                  transition: "all 0.3s ease",
                }}
                onClick={() => !editing && handleImageClick(imageUrl)}
              >
                {hasError ? (
                  <Box sx={{ width: "300px", height: "200px", backgroundColor: "#f5f5f5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #ddd", borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: "#666" }}>Không thể hiển thị ảnh</Typography>
                  </Box>
                ) : (
                  <>
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt={`Post image ${index + 1}`}
                      style={{ width: "auto", height: "auto", display: "block", maxWidth: "300px", maxHeight: "200px", objectFit: "contain", opacity: 0, transition: "opacity 0.3s ease-in-out" }}
                      onLoad={(e) => { e.target.style.opacity = "1" }}
                      onError={() => setFailedImageUrls(prev => new Set([...prev, imageUrl]))}
                    />
                    {/* Khi edit: nút X để xóa ảnh */}
                    {editing ? (
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleRemoveEditingMedia(mediaIndex) }}
                        sx={{
                          position: "absolute", top: 4, right: 4,
                          backgroundColor: "rgba(0,0,0,0.55)",
                          color: "white",
                          "&:hover": { backgroundColor: "rgba(200,0,0,0.8)" },
                          width: 28, height: 28,
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    ) : (
                      <Box className="image-overlay" sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.3s ease" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 60, height: 60 }}>
                          <ZoomIn sx={{ color: "white", fontSize: 30 }} />
                        </Box>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )
          })}
        </Stack>
      </Box>
    )
  }

  const renderVideos = () => {
    const videosToShow = editing
      ? editingMedia.filter((m) => m.resource_type === 'video')
      : (post.videoUrl || post.vidUrl || [])

    if (videosToShow.length === 0 || !isDetailPage) return null;

    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Video ({videosToShow.length})
        </Typography>
        <Stack spacing={2}>
          {videosToShow.map((item, index) => {
            const videoUrl = editing ? (item.url || item.secure_url || '') : item
            const mediaIndex = editing ? editingMedia.findIndex((m) => m === item) : index
            return (
              <Box key={index} sx={{ position: "relative", borderRadius: 2, overflow: "hidden", backgroundColor: "black", width: "100%", maxWidth: "500px" }}>
                <video controls style={{ width: "100%", maxHeight: "300px", display: "block" }}>
                  <source src={videoUrl} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
                {editing && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveEditingMedia(mediaIndex)}
                    sx={{
                      position: "absolute", top: 6, right: 6,
                      backgroundColor: "rgba(0,0,0,0.55)",
                      color: "white",
                      "&:hover": { backgroundColor: "rgba(200,0,0,0.8)" },
                      width: 28, height: 28,
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </Box>
            )
          })}
        </Stack>
      </Box>
    )
  }

  const renderMediaIndicators = () => {
    const imageCount = post.imageCount ?? post.imgUrl?.length ?? 0
    const videoCount = post.videoCount ?? post.videoUrl?.length ?? post.vidUrl?.length ?? 0

    if (!isPreviewMode || (imageCount === 0 && videoCount === 0)) return null

    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{
          mb: cardSizing.spacing,
          flexWrap: "wrap",
          gap: 0.5,
        }}
      >
        {imageCount > 0 && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "rgba(25, 118, 210, 0.08)",
              color: "primary.main",
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontSize: isCompactPreview ? "0.65rem" : "0.75rem",
              fontWeight: 500,
              border: "1px solid rgba(25, 118, 210, 0.2)",
            }}
          >
            <Box component="span" sx={{ mr: 0.5, fontSize: "0.9em" }}>
              📷
            </Box>
            {imageCount} {imageCount === 1 ? "ảnh" : "ảnh"}
          </Box>
        )}

        {videoCount > 0 && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "rgba(156, 39, 176, 0.08)",
              color: "secondary.main",
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontSize: isCompactPreview ? "0.65rem" : "0.75rem",
              fontWeight: 500,
              border: "1px solid rgba(156, 39, 176, 0.2)",
            }}
          >
            <Box component="span" sx={{ mr: 0.5, fontSize: "0.9em" }}>
              🎥
            </Box>
            {videoCount} {videoCount === 1 ? "video" : "video"}
          </Box>
        )}
        {isCompactPreview && (imageCount > 0 || videoCount > 0) && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "rgba(76, 175, 80, 0.08)",
              color: "success.main",
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontSize: "0.65rem",
              fontWeight: 500,
              border: "1px solid rgba(76, 175, 80, 0.2)",
            }}
          >
            <Box component="span" sx={{ mr: 0.5, fontSize: "0.9em" }}>
              📎
            </Box>
            {imageCount + videoCount} media
          </Box>
        )}
      </Stack>
    )
  }

  // ✅ Content preview for preview modes
  const renderContentPreview = () => {
    if (!isPreviewMode || editing) return null

    const contentText = post.content?.replace(/<[^>]*>/g, "") || ""
    const maxLength = isCompactPreview ? 100 : 200
    const truncatedText = contentText.length > maxLength ? contentText.substring(0, maxLength) + "..." : contentText

    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: isCompactPreview ? 2 : 3,
          WebkitBoxOrient: "vertical",
          textOverflow: "ellipsis",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          hyphens: "auto",
          lineBreak: "anywhere",
          lineHeight: 1.4,
          mb: cardSizing.spacing,
        }}
      >
        {/* {truncatedText} */}
      </Typography>
    )
  }

  return (
    <>
      <Card
        sx={{
          padding: cardSizing.padding,
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
          ...(isPreviewMode && {
            maxHeight: isCompactPreview ? 200 : 350,
          }),
          ...(isPreviewMode && {
            transition: "all 0.2s ease",
            "&:hover": {
              boxShadow: theme.shadows[4],
              transform: "translateY(-2px)",
            },
          }),
        }}
        className="post-card"
      >
        <Box className={preview} sx={{ width: "100%", overflow: "hidden" }}>
          <HorizontalStack spacing={0} alignItems="initial" sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
            <Stack
              justifyContent="space-between"
              alignItems="center"
              spacing={cardSizing.spacing}
              sx={{
                backgroundColor: "grey.100",
                width: cardSizing.likeBoxWidth,
                minWidth: cardSizing.likeBoxWidth,
                p: isCompactPreview ? 0.5 : isPreviewMode ? 0.75 : 1,
              }}
            >
              <LikeBox likeCount={likeCount} liked={liked} onLike={handleLikee} compact={isPreviewMode} />
            </Stack>

            <PostContentBox
              clickable={preview}
              post={post}
              editing={editing}
              sx={{
                flex: 1,
                minWidth: 0,
                p: isCompactPreview ? 1 : isPreviewMode ? 1.5 : 2,
              }}
            >
              <HorizontalStack justifyContent="space-between" sx={{ mb: cardSizing.spacing }}>
                <ContentDetails
                  username={post?.author?.name || post?.name || user?.user?.name || "Anonymous"}
                  userId={post.author?._id}
                  createdAt={post.createdAt}
                  edited={post.edited}
                  preview={isPreviewMode}
                  compact={isCompactPreview}
                />

                {user && (isAuthor || isAdmin || isModerator) && !isCompactPreview && (
                  <IconButton
                    size={isPreviewMode ? "small" : "medium"}
                    onClick={handleMenuOpen}
                    title="Tùy chọn"
                  >
                    <MoreVert />
                  </IconButton>
                )}
              </HorizontalStack>

              <Menu
                anchorEl={menuAnchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
              >
                {isAuthor && (
                  <MenuItem onClick={handleEditPost} disabled={loading}>
                    <AiFillEdit style={{ marginRight: 8 }} />
                    {editing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
                  </MenuItem>
                )}

                {isModerator && (
                  <MenuItem onClick={handleToggleHide} disabled={loading}>
                    {post.deleted ? (
                      <>
                        <MdVisibility style={{ marginRight: 8 }} />
                        Hiện bài viết
                      </>
                    ) : (
                      <>
                        <MdVisibilityOff style={{ marginRight: 8 }} />
                        Ẩn bài viết
                      </>
                    )}
                  </MenuItem>
                )}

                {(isAuthor || isAdmin) && (
                  <MenuItem onClick={handleDeletePost} disabled={loading}>
                    <BiTrash style={{ marginRight: 8, color: theme.palette.error.main }} />
                    <span style={{ color: theme.palette.error.main }}>
                      {confirm ? 'Xác nhận xóa' : 'Xóa bài viết'}
                    </span>
                  </MenuItem>
                )}
              </Menu>

              {/* Thumbnail + text layout khi ở preview mode */}
              <HorizontalStack spacing={1.5} alignItems="center" sx={{ width: "100%", overflow: "hidden", minWidth: 0 }}>
                {/* Phần text chiếm hết không gian còn lại */}
                <Box sx={{ flex: 1, minWidth: 0, width: "100%", maxWidth: "100%" }}>
                  <Typography
                    variant={cardSizing.titleVariant}
                    gutterBottom
                    sx={{
                      overflow: "hidden",
                      maxHeight: cardSizing.titleMaxHeight,
                      maxWidth: "100%",
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: isCompactPreview ? 2 : isPreviewMode ? 2 : "none",
                      WebkitBoxOrient: "vertical",
                      lineHeight: isCompactPreview ? 1.2 : isPreviewMode ? 1.3 : 1.4,
                      mb: cardSizing.spacing,
                    }}
                    className="title"
                  >
                    {post.title}
                  </Typography>

                  {!isPreviewMode &&
                    (editing ? (
                      <ContentUpdateEditor
                        handleSubmit={handleSubmit}
                        originalContent={post.content}
                        originalTitle={post.title}
                        postId={post._id}
                        onCancel={() => setEditing(false)}
                      />
                    ) : (
                      <Box>
                        <HTMLContent content={post.content} maxHeight={cardSizing.contentMaxHeight} />
                        {!expanded && post.content?.length > 500 && (
                          <Button
                            size="small"
                            onClick={handleToggleExpand}
                            startIcon={<ExpandMore />}
                            sx={{
                              mt: 1,
                              textTransform: "none",
                              fontSize: "0.875rem",
                              fontWeight: 500,
                            }}
                          >
                            Đọc thêm
                          </Button>
                        )}
                      </Box>
                    ))}

                  {renderMediaIndicators()}
                  {isDetailPage && (
                    <>
                      {renderImages()}
                      {renderVideos()}
                    </>
                  )}

                  <HorizontalStack alignItems="center" spacing={3.75}>
                    <HorizontalStack spacing={0.5} alignItems="center">
                      <AiFillMessage size={16} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {post.commentCount || 0}
                      </Typography>
                    </HorizontalStack>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {new Date(post.createdAt).toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh'
                      })}
                    </Typography>
                  </HorizontalStack>
                </Box>

                {/* Thumbnail — chỉ hiện khi preview mode VÀ có ảnh */}
                {isPreviewMode && post.thumbnail && (
                  <Box
                    component="img"
                    src={post.thumbnail}
                    alt=""
                    sx={{
                      width: isCompactPreview ? 64 : 96,
                      height: isCompactPreview ? 64 : 96,
                      borderRadius: 2,
                      objectFit: "cover",
                      flexShrink: 0,
                      alignSelf: "center",

                    }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
              </HorizontalStack>
            </PostContentBox>
          </HorizontalStack>
        </Box>
      </Card>

      {/* Image Lightbox */}
      <ImageLightbox
        open={imageDialogOpen}
        imageUrl={selectedImage}
        onClose={handleCloseImageDialog}
      />
    </>
  )
}

export default React.memo(PostCard)
