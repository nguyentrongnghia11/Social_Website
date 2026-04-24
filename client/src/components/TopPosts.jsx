import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Divider,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { MdLeaderboard, MdThumbUp, MdChatBubble } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { getTopPosts } from "../api-axios/posts.";
import HorizontalStack from "./util/HorizontalStack";

const PERIODS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

/** Compact row hiển thị 1 bài top post */
const TopPostItem = ({ post, rank }) => {
  const navigate = useNavigate();
  const rankColor = RANK_COLORS[rank - 1] ?? "transparent";

  return (
    <CardActionArea
      onClick={() => navigate(`/posts/${post._id}`)}
      sx={{ borderRadius: 2 }}
    >
      <HorizontalStack spacing={1.5} alignItems="flex-start" p={1}>
        {/* Rank badge */}
        <Box
          sx={{
            minWidth: 28,
            height: 28,
            borderRadius: "50%",
            background: rank <= 3 ? rankColor : "action.hover",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: rank <= 3 ? `2px solid ${rankColor}` : "2px solid",
            borderColor: rank <= 3 ? rankColor : "divider",
          }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            fontSize={11}
            color={rank <= 3 ? "#222" : "text.secondary"}
          >
            {rank}
          </Typography>
        </Box>

        {/* Content */}
        <Box flex={1} minWidth={0}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            title={post.title}
            sx={{ lineHeight: 1.3, mb: 0.4 }}
          >
            {post.title || "(Không có tiêu đề)"}
          </Typography>

          <Typography variant="caption" color="text.secondary" noWrap>
            {post.author?.name ?? "Ẩn danh"}
          </Typography>

          <HorizontalStack spacing={1.5} mt={0.5}>
            <HorizontalStack spacing={0.3}>
              <MdThumbUp size={12} color="#888" />
              <Typography variant="caption" color="text.secondary">
                {post.likeCount ?? 0}
              </Typography>
            </HorizontalStack>
            <HorizontalStack spacing={0.3}>
              <MdChatBubble size={12} color="#888" />
              <Typography variant="caption" color="text.secondary">
                {post.commentCount ?? 0}
              </Typography>
            </HorizontalStack>
          </HorizontalStack>
        </Box>

        {/* Thumbnail */}
        {post.thumbnail && (
          <Box
            component="img"
            src={post.thumbnail}
            alt=""
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        )}
      </HorizontalStack>
    </CardActionArea>
  );
};

const TopPostSkeleton = () => (
  <HorizontalStack spacing={1.5} p={1}>
    <Skeleton variant="circular" width={28} height={28} />
    <Box flex={1}>
      <Skeleton variant="text" width="80%" height={16} />
      <Skeleton variant="text" width="50%" height={14} />
    </Box>
    <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 1.5 }} />
  </HorizontalStack>
);

const TopPosts = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [period, setPeriod] = useState("week");

  const fetchPosts = async (selectedPeriod) => {
    setLoading(true);
    try {
      const { data } = await getTopPosts(5, selectedPeriod, 1);
      setPosts(data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(period); }, [period]);

  const handlePeriod = (_, val) => { if (val) setPeriod(val); };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Stack>
        {/* Header */}
        <HorizontalStack spacing={1} p={2} pb={1}>
          <MdLeaderboard size={20} />
          <Typography variant="subtitle1" fontWeight={700}>
            Top Posts
          </Typography>
          <Box flex={1} />
          <Chip label={PERIODS.find((p) => p.value === period)?.label} size="small" color="primary" />
        </HorizontalStack>

        {/* Period toggle */}
        <Box px={2} pb={1}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriod}
            size="small"
            fullWidth
          >
            {PERIODS.map(({ value, label }) => (
              <ToggleButton key={value} value={value} sx={{ flex: 1, py: 0.4, fontSize: 12 }}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Divider />

        {/* List */}
        <Stack divider={<Divider />}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <TopPostSkeleton key={i} />)
            : posts.length > 0
              ? posts.map((post, i) => (
                <TopPostItem key={post._id} post={post} rank={i + 1} />
              ))
              : (
                <Box p={3} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Chưa có bài viết nào trong khoảng thời gian này
                  </Typography>
                </Box>
              )}
        </Stack>
      </Stack>
    </Card>
  );
};

export default TopPosts;
