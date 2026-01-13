import React, { useState, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { PersonAdd, PersonRemove } from '@mui/icons-material';
import { followUser, unfollowUser, getFollowStatus } from '../api-axios/user';
import { isLoggedIn } from '../helpers/authHelper';
import { useNavigate } from 'react-router-dom';

const FollowButton = ({ userId, onFollowChange }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const navigate = useNavigate();
  const currentUser = isLoggedIn();

  // Check if current user is following this user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUser || currentUser._id === userId) {
        setCheckingStatus(false);
        return;
      }

      const result = await getFollowStatus(userId);
      if (result.status === 200) {
        setIsFollowing(result.data?.isFollowing || false);
      }
      setCheckingStatus(false);
    };

    checkFollowStatus();
  }, [userId, currentUser]);

  const handleFollow = async (e) => {
    e.stopPropagation();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setLoading(true);
    
    try {
      if (isFollowing) {
        const result = await unfollowUser(userId);
        if (result.status === 200) {
          setIsFollowing(false);
          if (onFollowChange) onFollowChange(false);
        }
      } else {
        const result = await followUser(userId);
        if (result.status === 200) {
          setIsFollowing(true);
          if (onFollowChange) onFollowChange(true);
        }
      }
    } catch (error) {
      console.error('Follow action error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if viewing own profile
  if (!currentUser || currentUser._id === userId) {
    return null;
  }

  if (checkingStatus) {
    return (
      <Button variant="outlined" disabled size="small">
        <CircularProgress size={16} />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outlined" : "contained"}
      color={isFollowing ? "inherit" : "primary"}
      size="small"
      startIcon={loading ? <CircularProgress size={16} /> : (isFollowing ? <PersonRemove /> : <PersonAdd />)}
      onClick={handleFollow}
      disabled={loading}
      sx={{
        textTransform: 'none',
        minWidth: '100px',
      }}
    >
      {isFollowing ? 'Bỏ follow' : 'Follow'}
    </Button>
  );
};

export default FollowButton;
