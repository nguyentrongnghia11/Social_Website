import { Button, Card, Link, Stack, Typography, Snackbar, Alert } from "@mui/material";

import { Box } from "@mui/system";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { MdSettingsInputAntenna } from "react-icons/md";
import { useLocation, useSearchParams } from "react-router-dom";
import { isLoggedIn } from "../helpers/authHelper";
import CreatePost from "./CreatePost";
import Loading from "./Loading";
import PostCard from "./PostCard";
import SortBySelect from "./SortBySelect";
import HorizontalStack from "./util/HorizontalStack";
import { getALlPosts, searchPosts } from "../api-axios/posts.";
import { emitEvent, onEvent, offEvent } from "../helpers/socketHelper";

const PostBrowser = (props) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [end, setEnd] = useState(false);
  const [sortBy, setSortBy] = useState("-createdAt");
  const [count, setCount] = useState(0);  


  const [search] = useSearchParams();
  const [effect, setEffect] = useState(false);

  const searchExists =
    search && search.get("search") && search.get("search").length > 0;

  // Khai báo sorts TRƯỚC khi sử dụng trong handleSortBy
  const contentTypeSorts = useMemo(() => ({
    posts: {
      "-createdAt": "Latest",
      "-likeCount": "Likes",
      "-commentCount": "Comments",
      createdAt: "Earliest",
    },
    liked: {
      "-createdAt": "Latest",
      createdAt: "Earliest",
    },
  }), []);

  const sorts = useMemo(() => contentTypeSorts[props.contentType], [contentTypeSorts, props.contentType]);

  const fetchPostss = useCallback(async () => {
    setLoading(true);
    const newPage = page + 1;
    setPage(newPage);

    let query = {
      page: newPage,
      sortBy,
    };
    let data;
    if (props.contentType === "posts" && props.profileUser?.userPosts) {
      // Sử dụng data từ localStorage
      const userPosts = props.profileUser.userPosts;
      setLoading(false);
      setPosts(userPosts);
      setCount(userPosts.length);
      setEnd(true);
      return;
    }

    if (props.contentType === "liked" && props.profileUser?.likedPosts) {
      // Sử dụng data từ localStorage
      const likedPosts = props.profileUser.likedPosts;
      setLoading(false);
      setPosts(likedPosts);
      setCount(likedPosts.length);
      setEnd(true);
      return;
    }

    if (props.contentType === "posts") {
      if (props.profileUser) {
        query.author = props.profileUser.username;
        data = await getALlPosts(query);
      } else if (searchExists) {
        // Sử dụng API search mới
        query.q = search.get("search");
        query.limit = 10;
        data = await searchPosts(query);
      } else {
        data = await getALlPosts(query);
      }
    }
    else if (props.contentType === "liked") {
      data = await getALlPosts(query);
    }

    if (data.data.length < 10) {
      setEnd(true);
    }

    setLoading(false);
    if (!data.error) {
      setPosts([...posts, ...data.data]);
      setCount(data.count);
    }
  }, [page, sortBy, props.contentType, props.profileUser, searchExists, search, posts]);

  useEffect(() => {
    fetchPostss();
  }, [sortBy]); 

  useEffect(() => {
    setPosts([]);
    setPage(0);
    setEnd(false);
    setEffect(!effect);
  }, [search]);

  const handleSortBy = useCallback((e) => {
    const newSortName = e.target.value;
    let newSortBy;

    Object.keys(sorts).forEach((sortName) => {
      if (sorts[sortName] === newSortName) newSortBy = sortName;
    });

    setPosts([]);
    setPage(0);
    setEnd(false);
    setSortBy(newSortBy);
  }, [sorts]);

  const removePost = useCallback((removedPost) => {
    setPosts(posts.filter((post) => post._id !== removedPost._id));
  }, [posts]);

  const handleBackToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <>

      <Stack spacing={2}>
        <Card>
          <HorizontalStack justifyContent="space-between">
            {props.createPost && <CreatePost />}
            <SortBySelect
              onSortBy={handleSortBy}
              sortBy={sortBy}
              sorts={sorts}
            />
          </HorizontalStack>
        </Card>

        {searchExists && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Showing results for "{search.get("search")}"
            </Typography>
            <Typography color="text.secondary" variant="span">
              {count} results found
            </Typography>
          </Box>
        )}

        {posts.map((post, i) => (
          <PostCard
            preview="primary"
            key={post._id}
            post={post}
            removePost={removePost}
          />
        ))}

        {loading && <Loading />}
        {end ? (
          <Stack py={5} alignItems="center">
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {posts.length > 0 ? (
                <>All posts have been viewed</>
              ) : (
                <>No posts available</>
              )}
            </Typography>
            <Button variant="text" size="small" onClick={handleBackToTop}>
              Back to top
            </Button>
          </Stack>
        ) : (
          !loading &&
          posts &&
          posts.length > 0 && (
            <Stack pt={2} pb={6} alignItems="center" spacing={2}>
              <Button onClick={fetchPostss} variant="contained">
                Load more
              </Button>
              <Button variant="text" size="small" onClick={handleBackToTop}>
                Back to top
              </Button>
            </Stack>
          )
        )}
      </Stack>
    </>
  );
};

export default React.memo(PostBrowser);
