"use client"

import { useState } from "react"
import {
  Box,
  Divider,
  List,
  Stack,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  InputAdornment,
  CircularProgress,
  Button,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Alert,
  Skeleton,
} from "@mui/material"
import { AiFillMessage } from "react-icons/ai"
import { BiSad } from "react-icons/bi"
import {
  Add as AddIcon,
  Search as SearchIcon,
  Group as GroupIcon,
  Close as CloseIcon,
  PersonAdd,
} from "@mui/icons-material"
import UserMessengerEntry from "./UserMessengerEntry"
import HorizontalStack from "./util/HorizontalStack"
import { searchUser } from "../api-axios/user"
import { isLoggedIn } from "../helpers/authHelper"
import { emitEvent } from "../helpers/socketHelper"
import { useNavigate } from "react-router-dom"

const UserMessengerEntries = (props) => {
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [availableUsers, setAvailableUsers] = useState([])
  const [creatingGroup, setCreatingGroup] = useState(false)
  const navigate = useNavigate()


  const userCurrent = isLoggedIn()



  const handleSearchUsers = async (searchTerm) => {
    setSearchingUsers(true)
    const filtered = await searchUser(searchTerm)
    setAvailableUsers(filtered)
    setSearchingUsers(false)

  }

  const handleUserSearch = (value) => {
    setUserSearchTerm(value)
    if (value.trim()) {
      handleSearchUsers(value)
    } else {
      setAvailableUsers([])
    }
  }

  const handleSelectUser = (user) => {
    if (userCurrent.user._id === user._id) return;

    if (!selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user])
    }
    setUserSearchTerm("")
    setAvailableUsers([])
  }

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId))
  }


  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) return;
    setCreatingGroup(true);
    try {
      let memberIds = selectedUsers.map(u => u._id);
      if (userCurrent.user && !memberIds.includes(userCurrent.user._id)) {
        memberIds.push(userCurrent.user._id);
      }

      // Emit socket để tạo group và conversation thật luôn
      const groupData = {
        type: "group",
        senderId: userCurrent.user._id,
        nameSender: userCurrent.user.name,
        groupName: groupName,
        memberIds: memberIds,
        content: `Đã tạo nhóm "${groupName}"`
      };

      emitEvent("chat", groupData);

      setGroupName("");
      setSelectedUsers([]);
      setUserSearchTerm("");
      setAvailableUsers([]);
      
      // Notify parent to prepare UI (conversation will come from socket event)
      if (props.onGroupCreated) {
        props.onGroupCreated({
          newGroup: {
            name: groupName,
            members: selectedUsers,
            memberIds: memberIds,
            isGroup: true
          }
        });
      }
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setCreatingGroup(false);
      if (props.onCloseCreateGroup) props.onCloseCreateGroup();
    }
  }

  const handleCloseCreateGroup = () => {
    setGroupName("")
    setSelectedUsers([])
    setUserSearchTerm("")
    setAvailableUsers([])
    if (props.onCloseCreateGroup) {
      props.onCloseCreateGroup()
    }
    if (props.setShowCreateGroup) {
      props.setShowCreateGroup(false)
    }
  }

  const handleOpenDialog = () => {
    if (props.onCreateGroup) {
      props.onCreateGroup()
    } else if (props.setShowCreateGroup) {
      props.setShowCreateGroup(true)
    }
  }
  return (
    <Stack sx={{ height: "100%" }}>
      <HorizontalStack alignItems="center" justifyContent="space-between" sx={{ px: 2, height: "60px" }}>
        <HorizontalStack alignItems="center" spacing={2}>
          <AiFillMessage size={30} />
          <Typography>
            <b>Your Conversations</b>
          </Typography>
        </HorizontalStack>
        <IconButton
          onClick={handleOpenDialog}
          sx={{
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
          }}
          size="small"
        >
          <AddIcon />
        </IconButton>
      </HorizontalStack>

      <Divider />

      <Box sx={{ height: "calc(100vh - 171px)", flex: 1 }}>
        {props.conversations.length > 0 ? (
          <Box sx={{ height: "100%" }}>
            <List sx={{ padding: 0, maxHeight: "100%", overflowY: "auto" }}>
              {props.conversations.map((conversation, idx) => (
                <UserMessengerEntry
                  conservant={props.conservant}
                  conversation={conversation}
                  key={conversation?._id || '1'}
                  setConservant={props.setConservant}
                  selected={props.selected}
                  setSelected={props.setSelected}
                  onMarkedAsRead={() => {
                    if (conversation.unreadCount > 0 && props.setConversations) {
                      props.setConversations(prev => {
                        const updated = [...prev];
                        updated[idx] = { ...updated[idx], unreadCount: 0 };
                        return updated;
                      });
                    }
                  }}
                />
              ))}
            </List>
          </Box>
        ) : (
          <Stack sx={{ height: "100%" }} justifyContent="center" alignItems="center" spacing={2} textAlign="center">
            <BiSad size={60} />
            <Typography variant="h5">No Conversations</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: "70%" }}>
              Click 'Message' on another user's profile to start a conversation
            </Typography>
            <Button variant="contained" startIcon={<GroupIcon />} onClick={handleOpenDialog} sx={{ mt: 2 }}>
              Create Group
            </Button>
          </Stack>
        )}
      </Box>

      <Dialog open={props.showCreateGroup || false} onClose={handleCloseCreateGroup} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Tạo nhóm mới</Typography>
            <IconButton onClick={handleCloseCreateGroup} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            <Stack spacing={3}>
              {/* Group Name */}
              <TextField
                fullWidth
                label="Tên nhóm"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nhập tên nhóm..."
                helperText="Tên nhóm phải có ít nhất 3 ký tự"
              />
              {/* Selected Users Summary */}
              {selectedUsers.length > 0 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">Thành viên đã chọn ({selectedUsers.length})</Typography>
                    <Button size="small" onClick={() => setSelectedUsers([])} color="error" variant="outlined">
                      Xóa tất cả
                    </Button>
                  </Stack>
                  <Box sx={{ maxHeight: 120, overflow: "auto", p: 1, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {selectedUsers.map((user) => (
                        <Chip
                          key={user._id}
                          label={user.name}
                          onDelete={() => handleRemoveUser(user._id)}
                          avatar={<Avatar src={user.avatar}>{user.name?.charAt(0)}</Avatar>}
                          variant="filled"
                          color="primary"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Box>
                </Box>
              )}
              {/* User Search */}
              <TextField
                fullWidth
                label="Tìm kiếm và thêm thành viên"
                value={userSearchTerm}
                onChange={(e) => handleUserSearch(e.target.value)}
                placeholder="Nhập tên hoặc email để tìm kiếm..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {searchingUsers ? <CircularProgress size={20} /> : <SearchIcon />}
                    </InputAdornment>
                  ),
                }}
              />
              {/* ...các phần JSX khác... */}
            </Stack>
            {/* ...các phần JSX khác... */}

            {/* Search Results */}
            {availableUsers.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Kết quả tìm kiếm ({availableUsers.length})
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: "auto", border: "1px solid #e0e0e0", borderRadius: 1 }}>
                  <List dense>
                    {availableUsers.map((user) => {
                      const isSelected = selectedUsers.find((u) => u._id === user._id)
                      return (
                        <ListItem key={user._id} disablePadding>
                          <ListItemButton
                            onClick={() => handleSelectUser(user)}
                            disabled={isSelected}
                            sx={{
                              opacity: isSelected ? 0.5 : 1,
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar src={user.avatar}>{user.name.charAt(0)}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={user.name}
                              secondary={user.email}
                              primaryTypographyProps={{
                                fontWeight: isSelected ? 600 : 400,
                              }}
                            />
                            {isSelected ? (
                              <Typography variant="caption" color="primary">
                                Đã thêm
                              </Typography>
                            ) : (
                              <PersonAdd color="action" />
                            )}
                          </ListItemButton>
                        </ListItem>
                      )
                    })}
                  </List>
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseCreateGroup}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || groupName.length < 1 || selectedUsers.length < 2 || creatingGroup}
            startIcon={creatingGroup ? <CircularProgress size={20} /> : <GroupIcon />}
          >
            {creatingGroup ? "Đang tạo..." : `Tạo nhóm (${selectedUsers.length} thành viên)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default UserMessengerEntries
