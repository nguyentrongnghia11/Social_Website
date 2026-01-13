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
    recipient = props.conversation.groupId;
  } else if (props.conversation.receiverId && props.conversation.senderId) {
    if (props.conversation.senderId?._id === user?._id) {
      recipient = props.conversation.receiverId;
    } else if (props.conversation.receiverId?._id === user?._id) {
      recipient = props.conversation.senderId;
    } else {
      recipient = props.conversation.receiverId;
    }
  } else if (props.conversation.recipient) {
    recipient = props.conversation.recipient;
  } else {
    recipient = undefined;
  }


  const username = recipient !== null ? recipient.name : "No name"



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
          secondary={moment(props.conversation.lastMessageAt).fromNow()}
        />
      </MenuItem>
    </>
  );
};

export default UserMessengerEntry;
