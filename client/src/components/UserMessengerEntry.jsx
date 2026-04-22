import {
  Divider,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
} from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import UserAvatar from "./UserAvatar";

import moment from "moment";
import { isLoggedIn } from "../helpers/authHelper";
import { markConversationAsRead } from "../api-axios/conservation";

const UserMessengerEntry = (props) => {

  // console.log ("Rendering UserMessengerEntry with conversation: ", props.conversation)

  const userAuth = isLoggedIn()
  const user = userAuth?.user || userAuth
  let recipient;
  if (props.conversation.type === "group") {
    // Group conversation: lấy từ groupInfo (model mới)
    const groupInfo = props.conversation.groupInfo || props.conversation.groupId;
    recipient = groupInfo ? {
      _id: groupInfo.groupId || groupInfo._id,
      name: groupInfo.name,
      avatar: groupInfo.avatar,
      members: props.conversation.participants || groupInfo.members || [],
      isGroup: true
    } : undefined;
  } else if (props.conversation.participants && props.conversation.participants.length > 0) {
    // Model mới: participants[] snapshot — luôn ưu tiên dùng trường này
    const other = props.conversation.participants.find(
      p => p?._id?.toString() !== user?._id?.toString()
    );
    recipient = other || props.conversation.participants[0];
  } else if (props.conversation.recipient) {
    recipient = props.conversation.recipient;
  } else {
    recipient = undefined;
  }

  // Safety guard: nếu dữ liệu cũ trong DB chưa có participants[], hiển placeholder
  const username = recipient?.name || "Unknown";


  const selected = props.conservant && username === props.conservant.name;



  const handleClick = async () => {
    // Only call API if conversation has real ID
    if (props.conversation?._id) {
      const ok = await markConversationAsRead(props.conversation._id);
      if (ok && typeof props.onMarkedAsRead === 'function') {
        props.onMarkedAsRead();
      }
    }
    props.setConservant({ ...recipient, conversationId: props.conversation._id });
  };

  return (
    <>
      <MenuItem
        onClick={handleClick}
        sx={{ padding: 2 }}
        divider
        disableGutters
        selected={selected}
      >
        <ListItemAvatar>
          <UserAvatar height={45} width={45} username={username} />
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <span>{username}</span>

              {/* {console.log('Unread count:', props.conversation.unreadCount)} */}
              {props.conversation.unreadCount > 0 && (
                <Box
                  sx={{
                    background: '#e53935',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    minWidth: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 1,
                    px: 1,
                  }}
                >
                  {props.conversation.unreadCount}
                </Box>
              )}
            </Box>
          }
          secondary={moment(props.conversation.lastMessage?.createdAt || props.conversation.lastMessageAt).fromNow()}
        />
      </MenuItem>
    </>
  );
};

export default UserMessengerEntry;
