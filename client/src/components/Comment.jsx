import { Button, IconButton, Typography, useTheme, Menu, MenuItem } from "@mui/material";
import { Box, compose } from "@mui/system";
import React, { useState, useCallback } from "react";
import { AiFillEdit, AiOutlineLine, AiOutlinePlus } from "react-icons/ai";
import { MoreVert } from "@mui/icons-material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isLoggedIn } from "../helpers/authHelper";
import CommentEditor from "./CommentEditor";
import ContentDetails from "./ContentDetails";
import HorizontalStack from "./util/HorizontalStack";
import { deleteComment, updateComment, createComment, hideComment, unhideComment } from "../api-axios/posts.";
import ContentUpdateEditor from "./ContentUpdateEditor";
import Markdown from "./Markdown";
import { MdCancel, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { BiReply, BiTrash } from "react-icons/bi";
import { BsReply, BsReplyFill } from "react-icons/bs";
import moment from "moment";

const Comment = (props) => {
  const theme = useTheme();
  const iconColor = theme.palette.primary.main;
  const { depth, addComment, removeComment, editComment } = props;
  const comment = props.comment;
  const [minimised, setMinimised] = useState(depth % 4 === 3);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  // const [comment, setComment] = useState(commentData);
  const user = isLoggedIn();
  const isAuthor = user && user.userId === comment.userId?._id;
  const isModerator = user && (user.user?.role === 'admin' || user.user?.role === 'moderator' || user.user?.permissions?.includes('hide_comment'));
  const [loading, setLoading] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
  const navigate = useNavigate();
  const param = useParams()

  console.log("user ne cu ", user)




  const handleSetReplying = useCallback(() => {
    if (isLoggedIn()) {
      setReplying(!replying);
    } else {
      navigate("/login");
    }
  }, [replying, navigate]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const content = e.target.content.value;

    await updateComment(comment._id, user, { content });

    const newCommentData = { ...comment, content, edited: true };

    // setComment(newCommentData);

    editComment(newCommentData);

    setEditing(false);
  }, [comment, user, editComment]);

  const handleToggleHide = useCallback(async (e) => {
    e.stopPropagation()
    handleMenuClose()
    setLoading(true)
    try {
      if (comment.deleted) {
        await unhideComment(comment._id)
        editComment({ ...comment, deleted: false })
      } else {
        await hideComment(comment._id)
        editComment({ ...comment, deleted: true })
      }
    } catch (error) {
      console.error(error)
      alert('Có lỗi xảy ra khi thay đổi trạng thái bình luận')
    }
    setLoading(false)
  }, [comment, editComment])

  const handleMenuOpen = useCallback((e) => {
    e.stopPropagation()
    setMenuAnchorEl(e.currentTarget)
  }, [])

  const handleMenuClose = useCallback((e) => {
    if (e) e.stopPropagation()
    setMenuAnchorEl(null)
  }, [])


  const handleSubmit2 = useCallback(async (e) => {
    e.preventDefault();

    const content = e.target.content.value;
    const newComment = {
      content: content,
      ... (comment.parentID && { parentID: comment.parentID })

    }

    const data = await createComment(newComment, param)
    // setComment(newComment);

    editComment(newComment);

    setEditing(false);
  }, [comment.parentID, param, editComment]);

  const handleDelete = useCallback(async () => {
    await deleteComment(comment._id, user);
    removeComment(comment);
  }, [comment, user, removeComment]);

  let style = {
    backgroundColor: theme.palette.grey[100],
    borderRadius: 1.5,
    mb: theme.spacing(2),
    padding: theme.spacing(0),
  };

  if (depth % 2 === 1) {
    style.backgroundColor = "white";
  }

  return (
    <Box sx={style}>
      <Box
        sx={{
          pl: theme.spacing(2),
          pt: theme.spacing(1),
          pb: theme.spacing(1),
          pr: 1,
        }}
      >
        {props.profile ? (
          // ow day la phan post 
          <Box>
            <Typography variant="h6">
              <Link underline="hover" to={"/posts/" + (comment.post?._id || comment._id)}>
                {comment.post?.title || comment.title || "Untitled"}
              </Link>
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {moment(comment.createdAt || new Date()).fromNow()}{" "}
              {comment.edited && <>(Edited)</>}
            </Typography>
          </Box>
        ) : (
          <>
            <HorizontalStack justifyContent="space-between" >
              <HorizontalStack>
                <ContentDetails
                  username={comment.commenter?.username || "trongnghia"}
                  createdAt={comment.createdAt}
                  edited={comment.edited}

                />

                <IconButton
                  color="primary"
                  onClick={() => setMinimised(!minimised)}
                >
                  {minimised ? (
                    <AiOutlinePlus size={15} />
                  ) : (
                    <AiOutlineLine size={15} />
                  )}
                </IconButton>
              </HorizontalStack>
              {!minimised && (
                <HorizontalStack spacing={1}>
                  <IconButton
                    variant="text"
                    size="small"
                    onClick={handleSetReplying}
                  >
                    {!replying ? (
                      <BsReplyFill color={iconColor} />
                    ) : (
                      <MdCancel color={iconColor} />
                    )}
                  </IconButton>
                  {user && (isAuthor || isModerator) && (
                    <IconButton
                      variant="text"
                      size="small"
                      onClick={handleMenuOpen}
                      title="Tùy chọn"
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  )}
                </HorizontalStack>
              )}
            </HorizontalStack>

            <Menu
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
            >
              {(isAuthor || user?.isAdmin) && (
                <MenuItem onClick={() => { setEditing(!editing); handleMenuClose(); }} disabled={loading}>
                  <AiFillEdit style={{ marginRight: 8 }} />
                  {editing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
                </MenuItem>
              )}

              {isModerator && (
                <MenuItem onClick={handleToggleHide} disabled={loading}>
                  {comment.deleted ? (
                    <>
                      <MdVisibility style={{ marginRight: 8 }} />
                      Hiện bình luận
                    </>
                  ) : (
                    <>
                      <MdVisibilityOff style={{ marginRight: 8 }} />
                      Ẩn bình luận
                    </>
                  )}
                </MenuItem>
              )}

              {(isAuthor || user?.isAdmin) && (
                <MenuItem onClick={handleDelete} disabled={loading}>
                  <BiTrash style={{ marginRight: 8, color: theme.palette.error.main }} />
                  <span style={{ color: theme.palette.error.main }}>Xóa bình luận</span>
                </MenuItem>
              )}
            </Menu>
          </>
        )}

        {!minimised && (
          <Box sx={{ mt: 1 }} overflow="hidden">
            {!editing ? (
              <Markdown content={comment.deleted ? "Comment was deleted" : comment.content} />
            ) : (
              <ContentUpdateEditor
                handleSubmit={handleSubmit2}
                originalContent={comment.content}
              />
            )}

            {replying && !minimised && (
              <Box sx={{ mt: 2 }}>
                <CommentEditor
                  comment={comment}
                  addComment={addComment}
                  setReplying={setReplying}
                  label="What are your thoughts on this comment?"
                />
              </Box>
            )}
            {comment.children && (
              <Box sx={{ pt: theme.spacing(2) }}>
                {comment.children.map((reply, i) => (
                  <Comment
                    key={reply._id}
                    comment={reply}
                    depth={depth + 1}
                    addComment={addComment}
                    removeComment={removeComment}
                    editComment={editComment}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(Comment);
