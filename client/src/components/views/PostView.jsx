import { Container, Stack , Box} from "@mui/material";
import React, { useEffect, useState } from "react";
import GoBack from "../GoBack";
import GridLayout from "../GridLayout";
import Loading from "../Loading";
import Navbar from "../Navbar";
import PostCard from "../PostCard";
import Sidebar from "../Sidebar";
import { useParams } from "react-router-dom";
// import { getPost } from "../../api/posts";
import Comments from "../Comments";
import ErrorAlert from "../ErrorAlert";
import { isLoggedIn } from "../../helpers/authHelper";
import { getALlPosts, getPost } from "../../api-axios/posts.";

const PostView = () => {
  const params = useParams();

  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const user = isLoggedIn();

  const fetchPost = async () => {
    console.log(params.id);
    setLoading(true);
    const { result, message, status } = await getPost(params.id);
    console.log(result[0])
    if (status != 200) {
      setError(message);
    } else {
      setPost(result[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPost();
  }, [params.id]);

  return (
    <Container>
      <Navbar />
      <GoBack />

      {loading ? (
        <Loading />
      ) : post ? (
        <Stack spacing={2}>
          <PostCard post={post} key={post._id} />
          <Comments />
        </Stack>
      ) : (
        error && <ErrorAlert error={error} />
      )}

      {/* Sidebar nằm dưới */}
      <Box sx={{ mt: 4, width: "50%" }}>
        <Sidebar />
      </Box>
    </Container>

  );
};

export default PostView;
