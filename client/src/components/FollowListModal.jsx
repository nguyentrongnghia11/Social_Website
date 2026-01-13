import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Typography,
  Button,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { getFollowers, getFollowing } from '../api-axios/user';
import { useNavigate } from 'react-router-dom';
import FollowButton from './FollowButton';

const FollowListModal = ({ open, onClose, userId, initialTab = 0 }) => {
  const [tab, setTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setPage(1);
      loadData(tab, 1);
    }
  }, [open, tab, userId]);

  const loadData = async (currentTab, currentPage = page) => {
    setLoading(true);
    
    try {
      const result = currentTab === 0 
        ? await getFollowers(userId, currentPage, 20)
        : await getFollowing(userId, currentPage, 20);

      if (result.status === 200) {
        const newData = result.data?.result || [];
        
        if (currentPage === 1) {
          currentTab === 0 ? setFollowers(newData) : setFollowing(newData);
        } else {
          if (currentTab === 0) {
            setFollowers([...followers, ...newData]);
          } else {
            setFollowing([...following, ...newData]);
          }
        }
        
        setHasMore(newData.length === 20);
      }
    } catch (error) {
      console.error('Error loading follow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(tab, nextPage);
  };

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
    onClose();
  };

  const currentList = tab === 0 ? followers : following;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label="Followers" />
            <Tab label="Following" />
          </Tabs>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading && page === 1 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : currentList.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">
              {tab === 0 ? 'Chưa có followers' : 'Chưa follow ai'}
            </Typography>
          </Box>
        ) : (
          <>
            <List>
              {currentList && currentList.length > 0 && currentList.map((user) => (
                <ListItem
                  key={user._id}
                  secondaryAction={
                    <FollowButton userId={user._id} />
                  }
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleUserClick(user._id)}
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={user.avatar || `https://robohash.org/${user.username || user.name}`}
                      alt={user.name}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={user.email}
                  />
                </ListItem>
              ))}
            </List>
            
            {hasMore && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Button 
                  onClick={handleLoadMore} 
                  disabled={loading}
                  variant="outlined"
                >
                  {loading ? <CircularProgress size={20} /> : 'Xem thêm'}
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FollowListModal;
