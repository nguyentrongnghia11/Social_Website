import { Card, Stack, Typography, ToggleButton, ToggleButtonGroup, Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { getTopPosts } from "../api-axios/posts.";
import { isLoggedIn } from "../helpers/authHelper";
import Loading from "./Loading";
import PostCard from "./PostCard";
import HorizontalStack from "./util/HorizontalStack";
import "react-icons/md";
import { MdLeaderboard } from "react-icons/md";

const TopPosts = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [period, setPeriod] = useState('week');
  const user = isLoggedIn();

  const fetchPosts = async (selectedPeriod = 'week') => {
    setLoading(true);
    try {
      const data = await getTopPosts(5, selectedPeriod, 1);
      setPosts(data.result || []);
    } catch (error) {
      console.error('Failed to fetch top posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(period);
  }, [period]);

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  return (
    <Stack spacing={2}>
      <Card>
        <Stack spacing={1.5} p={2}>
          <HorizontalStack>
            <MdLeaderboard />
            <Typography variant="h6">Top Posts</Typography>
          </HorizontalStack>
          
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriodChange}
            size="small"
            sx={{ width: '100%' }}
          >
            <ToggleButton value="day" sx={{ flex: 1 }}>
              Day
            </ToggleButton>
            <ToggleButton value="week" sx={{ flex: 1 }}>
              Week
            </ToggleButton>
            <ToggleButton value="month" sx={{ flex: 1 }}>
              Month
            </ToggleButton>
            <ToggleButton value="all" sx={{ flex: 1 }}>
              All
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Card>

      {!loading ? (
        posts && posts.length > 0 ? (
          <Stack spacing={2}>
            {posts.map((post) => (
              <PostCard preview="secondary" post={post} key={post._id} />
            ))}
          </Stack>
        ) : (
          <Card>
            <Box p={3} textAlign="center">
              <Typography color="text.secondary">
                No posts available for this period
              </Typography>
            </Box>
          </Card>
        )
      ) : (
        <Loading />
      )}
    </Stack>
  );
};

export default TopPosts;
