import { Button, Card, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { isLoggedIn } from "../helpers/authHelper";
import Comment from "./Comment";
import Loading from "./Loading";
import SortBySelect from "./SortBySelect";
import PostCard from "./PostCard";

const CommentBrowser = (props) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState("-createdAt");
  const [isCommentedPosts, setIsCommentedPosts] = useState(false);

  const fetchComments = async () => {
    setLoading(true);

    // Nếu có commentedPosts từ localStorage (đây là các posts đã comment)
    if (props.profileUser?.commentedPosts) {
      setComments(props.profileUser.commentedPosts);
      setIsCommentedPosts(true);
      setLoading(false);
      return;
    }

    const newPage = page + 1;
    setPage(newPage);

    let comments = await getUserComments({
      id: props.profileUser._id,
      query: { sortBy },
    });

    setComments(comments);
    setIsCommentedPosts(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [sortBy]);

  const handleSortBy = (e) => {
    const newSortName = e.target.value;
    let newSortBy;

    Object.keys(sorts).forEach((sortName) => {
      if (sorts[sortName] === newSortName) newSortBy = sortName;
    });

    setComments([]);
    setPage(0);
    setSortBy(newSortBy);
  };

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const sorts = {
    "-createdAt": "Latest",
    createdAt: "Earliest",
  };

  return (
    <Stack spacing={2}>
      <Card>
        <SortBySelect onSortBy={handleSortBy} sortBy={sortBy} sorts={sorts} />
      </Card>
      {loading ? (
        <Loading />
      ) : (
        <>
          {comments &&
            comments.map((item) => (
              isCommentedPosts ? (
                // Hiển thị post cards nếu là commentedPosts từ localStorage
                <PostCard key={item._id} post={item} preview="primary" />
              ) : (
                // Hiển thị comments nếu từ API
                <Comment key={item._id} comment={item} profile />
              )
            ))}

          <Stack py={5} alignItems="center">
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {comments.length > 0 ? (
                <>{isCommentedPosts ? 'All commented posts have been viewed' : 'All comments have been viewed'}</>
              ) : (
                <>{isCommentedPosts ? 'No commented posts available' : 'No comments available'}</>
              )}
            </Typography>
            <Button variant="text" size="small" onClick={handleBackToTop}>
              Back to top
            </Button>
          </Stack>
        </>
      )}
    </Stack>
  );
};

export default CommentBrowser;
