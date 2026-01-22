import { Card, Stack, Typography, Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { getSimilarPosts } from "../api-axios/posts.";
import Loading from "./Loading";
import PostCard from "./PostCard";
import HorizontalStack from "./util/HorizontalStack";
import { MdRecommend } from "react-icons/md";

const SimilarPosts = ({ postId }) => {
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);

    const fetchSimilarPosts = async () => {
        setLoading(true);
        try {
            const data = await getSimilarPosts(postId, 5);
            setPosts(data.result || []);
        } catch (error) {
            console.error('Error fetching similar posts:', error);
            setPosts([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (postId) {
            fetchSimilarPosts();
        }
    }, [postId]);

    if (loading) return <Loading />;
    if (!posts || posts.length === 0) return null;

    return (
        <Box sx={{ mt: 4 }}>
            <Stack spacing={2}>
                <Card sx={{ p: 2 }}>
                    <HorizontalStack spacing={1}>
                        <MdRecommend size={24} />
                        <Typography variant="h6">Bài viết tương tự</Typography>
                    </HorizontalStack>
                </Card>
                {posts.map((post) => (
                    <PostCard preview="secondary" post={post} key={post._id} />
                ))}
            </Stack>
        </Box>
    );
};

export default SimilarPosts;
