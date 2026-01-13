import { useTheme } from "@emotion/react";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Stack,
  Typography,
  Chip,
  Alert,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import { AiFillEdit } from "react-icons/ai";
import { MdBlock } from "react-icons/md";
import { isLoggedIn } from "../helpers/authHelper";
import ContentUpdateEditor from "./ContentUpdateEditor";
import Footer from "./Footer";
import Loading from "./Loading";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";
import FollowButton from "./FollowButton";
import FollowListModal from "./FollowListModal";

const Profile = (props) => {
  const [user, setUser] = useState(null);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const currentUser = isLoggedIn();
  const theme = useTheme();
  const iconColor = theme.palette.primary.main;

  useEffect(() => {
    if (props.profile) {
      console.log ('pppp',props.profile)
      setUser(props.profile);
      setFollowersCount(props.profile.followersCount || 0);
      setFollowingCount(props.profile.followingCount || 0);
    }
  }, [props.profile]);

  // Lấy dữ liệu từ localStorage nếu đang xem profile của chính mình
  const getProfileStats = () => {
    if (!user) return { likes: 0, posts: 0 };
    
    // Nếu có userPosts, likedPosts và commentedPosts từ localStorage (profile của mình)
    if (user.userPosts !== undefined || user.likedPosts !== undefined) {
      return {
        likes: user.likedPosts?.length || 0,
        posts: user.userPosts?.length || user.postCount || 0,
      };
    }
    
    // Fallback cho profile người khác
    return {
      likes: user.totalLike || 0,
      posts: user.postCount || 0,
    };
  };

  const stats = getProfileStats();

  const handleOpenFollowers = () => {
    setFollowModalTab(0);
    setFollowModalOpen(true);
  };

  const handleOpenFollowing = () => {
    setFollowModalTab(1);
    setFollowModalOpen(true);
  };

  const handleFollowChange = (isFollowing) => {
    setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
  };

  return (
    <Card>
      {user ? (
        <Stack alignItems="center" spacing={2}>
          <Box my={1}>
            <UserAvatar width={150} height={150} username={user.username} />
          </Box>

          <Typography variant="h5">{user.name}</Typography>

          {user.status === 'banned' && (
            <Alert 
              severity="error" 
              icon={<MdBlock />}
              sx={{ width: '100%' }}
            >
              Tài khoản này đã bị khóa
            </Alert>
          )}

          {props.editing ? (
            <Box>
              <ContentUpdateEditor
                handleSubmit={props.handleSubmit}
                originalContent={user.biography}
                validate={props.validate}
              />
            </Box>
          ) : user.biography ? (
            <Typography textAlign="center" variant="p">
              <b>Bio: </b>
              {user.biography}
            </Typography>
          ) : (
            <Typography variant="p">
              <i>No bio yet</i>
            </Typography>
          )}

          {currentUser && user._id === currentUser.user._id && (
            <Box>
              <Button
                startIcon={<AiFillEdit color={iconColor} />}
                onClick={props.handleEditing}
              >
                {props.editing ? <>Cancel</> : <>Edit bio</>}
              </Button>
            </Box>
          )}

          {currentUser && user._id !== currentUser.user._id && (
            <Stack direction="row" spacing={1}>
              <Button 
                variant="outlined" 
                onClick={props.handleMessage}
                disabled={user.status === 'banned'}
              >
                Message
              </Button>
              <FollowButton userId={user._id} onFollowChange={handleFollowChange} />
            </Stack>
          )}

          <HorizontalStack spacing={3}>
            <Typography 
              color="text.secondary"
              sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
              onClick={handleOpenFollowers}
            >
              <b>{followersCount}</b> Followers
            </Typography>
            <Typography 
              color="text.secondary"
              sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
              onClick={handleOpenFollowing}
            >
              <b>{followingCount}</b> Following
            </Typography>
          </HorizontalStack>

          <HorizontalStack>
            <Typography color="text.secondary">
              Likes <b>{stats.likes}</b>
            </Typography>
            <Typography color="text.secondary">
              Posts <b>{stats.posts}</b>
            </Typography>
          </HorizontalStack>
        </Stack>
      ) : (
        <Loading label="Loading profile" />
      )}
      
      {user && (
        <FollowListModal
          open={followModalOpen}
          onClose={() => setFollowModalOpen(false)}
          userId={user._id}
          initialTab={followModalTab}
        />
      )}
    </Card>
  );
};

export default Profile;
