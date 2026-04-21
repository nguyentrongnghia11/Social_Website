import { Stack, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import Comment from "./Comment";
import Loading from "./Loading";
//import { getComments } from "../api/posts";
import { useParams } from "react-router-dom";
import CommentEditor from "./CommentEditor";
import { getComments } from "../api-axios/posts.";

const Comments = () => {

  const [comments, setComments] = useState(null);
  const [rerender, setRerender] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const params = useParams();

  const fetchComments2 = async () => {
    const data = await getComments(params.id);
    console.log ("data result ", data.result)
    if (data.error) {
      setError("Failed to fetch comments");
    }
    else {

      console.log ("Data result ", data)
      setComments(data.result)
      return data.result;
    }
  }

  // console.log(comments)


  useEffect(() => {
    console.log ("fetaching ccomment")
    fetchComments2()
  }, [])

  const findComment = (id) => {
    let commentToFind;



    const recurse = (comment, id) => {
      console.log(comment);
      if (comment._id === id) {
        commentToFind = comment;
      } else {
        console.log(comment.children)
        for (let i = 0; i < comment.children.length; i++) {
          const commentToSearch = comment.children[i];
          recurse(commentToSearch, id);
        }
      }
    };

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      recurse(comment, id);
    }
    return commentToFind;
  };

  const removeComment = (removedComment) => {
    // if (removedComment.parent) {
    //   const parentComment = findComment(removedComment.parent);
    //   parentComment.children = parentComment.children.filter(
    //     (comment) => comment._id !== removedComment._id
    //   );
    //   setRerender(!rerender);
    // } else {
    //   setComments(
    //     comments.filter((comment) => comment._id !== removedComment._id)
    //   );
    // }
  };

  const editComment = (editedComment) => {
    // if (editedComment.parent) {
    //   let parentComment = findComment(editedComment.parent);
    //   for (let i = 0; i < parentComment.children.length; i++) {
    //     if (parentComment.children[i]._id === editedComment._id) {
    //       parentComment.children[i] = editedComment;
    //     }
    //   }
    // } else {
    //   for (let i = 0; i < comments.length; i++) {
    //     if (comments[i]._id === editedComment._id) {
    //       comments[i] = editedComment;
    //     }
    //   }
    //   setRerender(!rerender);
    // }
  };

  const addComment = async (comment) => {
    const updatedComments = await fetchComments2();
    if (updatedComments) {
      setComments(updatedComments);
      setRerender(prev => !prev);
    }
  };


  return comments ? (
    <Stack spacing={2}>
      <CommentEditor
        addComment={addComment}
        label="What are your thoughts on this post?"
      />

      {comments.length > 0 ? (
        <Box pb={4}>
          {comments.map((comment, i) => {
            return comment.isToxic === "clean" && (
              <Comment
                addComment={addComment}
                removeComment={removeComment}
                editComment={editComment}
                comment={comment}
                key={comment._id}
                depth={0}
              />
            )
          }
          )}
          {loading && <Loading />}
        </Box>
      ) : (
        <Box
          display="flex"
          justifyContent="center"
          textAlign="center"
          paddingY={3}
        >
          <Box>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No comments yet...
            </Typography>
            <Typography variant="body" color="text.secondary">
              Be the first one to comment!
            </Typography>
          </Box>
        </Box>
      )}
    </Stack>
  ) : (
    <Loading label="Loading comments" />
  );
};

export default Comments;
