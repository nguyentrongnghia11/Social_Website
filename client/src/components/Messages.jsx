"use client"

import {
  Button,
  Divider,
  IconButton,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Badge,
} from "@mui/material"
import { Box } from "@mui/system"
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { AiFillCaretLeft, AiFillMessage } from "react-icons/ai"
import { Info as InfoIcon, Group as GroupIcon, Person as PersonIcon, Close as CloseIcon } from "@mui/icons-material"
import { Link } from "react-router-dom"
import { isLoggedIn } from "../helpers/authHelper"
import Loading from "./Loading"
import Message from "./Message"
import SendMessage from "./SendMessage"
import UserAvatar from "./UserAvatar"
import HorizontalStack from "./util/HorizontalStack"
import { getMessageOfUser } from "../api-axios/messages"
import { onEvent, offEvent, emitEvent, isSocketConnected } from "../helpers/socketHelper"
import CallButtons from "./CallButtons"

const Messages = (props) => {
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const userAuth = isLoggedIn()
  const user = userAuth?.user || userAuth
  const [messages, setMessages] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])

  const conversationsRef = useRef(props.conversations)
  const conservantRef = useRef(props.conservant)
  const messagesRef = useRef(messages)
  const typingTimeoutRef = useRef(null)

  // console.log("🚀 [Messages] Rendering Messages component with conservant:", props)

  useEffect(() => {
    conversationsRef.current = props.conversations
    conservantRef.current = props.conservant
    messagesRef.current = messages
  })

  // console.log("Finding conversation for conservant:", props)

  const conversation = useMemo(() =>

    props.conversations && props.conservant && props.getConversation(props.conversations, props.conservant.conversationId),
    [props.conversations, props.conservant, props.getConversation]
  );

  const setDirection = useCallback((messages) => {
    messages.forEach((message) => {
      if (message.senderId._id === user?._id) {
        message.direction = "from"
      } else {
        message.direction = "to"
      }
    })
  }, [user?._id]);

  const fetchMessages2 = useCallback(async (pageToFetch = 1, append = false) => {
    // Draft mode: conservant exists but no conversationId yet
    if (props.conservant && !props.conservant.conversationId) {
      setMessages([])
      setLoading(false)
      setHasMore(false)
      return
    }

    if (conversation && conversation._id) {
      if (pageToFetch === 1) setLoading(true)
      else setLoadingMore(true)

      const response = await getMessageOfUser(conversation._id, { page: pageToFetch, limit: 50 })
      if (response && response.data) {
        setDirection(response.data)
        if (append && messages) {
          setMessages((prev) => [...response.data, ...prev])
        } else {
          setMessages(response.data)
        }
        setHasMore(response.data.length === 50)
      } else {
        setHasMore(false)
      }

      if (pageToFetch === 1) setLoading(false)
      else setLoadingMore(false)
    } else {
      setMessages([])
      setLoading(false)
      setHasMore(false)
      setLoadingMore(false)
    }
  }, [conversation, props.conservant, setDirection, messages]);

  const handleJoinRoom = useCallback(() => {
    // Don't join if draft mode (no conversationId yet)
    if (!conversation || !conversation._id) {
      return;
    }
    emitEvent("join-conversation", conversation._id);
  }, [conversation]);

  useEffect(() => {
    setPage(1)
    fetchMessages2(1)
    setTypingUsers([])
    handleJoinRoom();
  }, [props.conservant, handleJoinRoom])

  useEffect(() => {
    if (messages && page === 1) {
      scrollToBottom()
    }
  }, [messages, page])
  // Scroll lên để tải thêm tin nhắn cũ
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || loadingMore || !hasMore) return;
    if (container.scrollTop === 0) {
      const prevHeight = container.scrollHeight;
      const nextPage = page + 1;
      setLoadingMore(true);
      fetchMessages2(nextPage, true).then(() => {
        setPage(nextPage);
        setTimeout(() => {
          if (container.scrollHeight > prevHeight) {
            container.scrollTop = container.scrollHeight - prevHeight;
          }
        }, 50);
      });
    }
  }, [fetchMessages2, page, loadingMore, hasMore]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, []);

  const handleSendMessage = useCallback(async (content, mediaFiles = []) => {
    console.log('🚀 [Messages.handleSendMessage] Called with:', {
      content,
      mediaFiles,
      mediaFilesLength: mediaFiles.length
    });

    if (!props.conservant) {
      console.error('Cannot send message - no conservant');
      return;
    }

    // Draft mode: no conversation exists yet - create it with first message
    if (!props.conservant.conversationId) {
      // Show optimistic message
      const newMessage = { direction: "from", content, senderId: user, mediaFiles };
      console.log('📝 Draft mode - Creating new conversation with mediaFiles:', mediaFiles);
      setMessages([newMessage]);

      // Determine type and prepare data
      const isGroup = props.conservant.isGroup === true;

      if (isGroup) {
        // Create group conversation
        const eventData = {
          content,
          mediaFiles,
          type: "group",
          groupName: props.conservant.name,
          memberIds: props.conservant.memberIds || [],
          senderId: user?._id,
          nameSender: user?.name,
        };
        emitEvent("chat", eventData);
      } else {
        // Create 1-on-1 conversation
        const eventData = {
          content,
          mediaFiles,
          type: "user",
          senderId: user?._id,
          nameSender: user?.name,
          receiverId: props.conservant._id,
        };
        emitEvent("chat", eventData);
      }
      return;
    }

    // Existing conversation - normal flow
    if (!conversation) {
      console.error('Cannot send message - conversation not found');
      return;
    }

    const newMessage = { direction: "from", content, mediaFiles };
    console.log('📤 Sending message with mediaFiles:', mediaFiles);
    const newMessages = [...(messages || []), newMessage];
    setMessages(newMessages);

    // Update conversation list
    const updatedConversation = { ...conversation };
    const newConversations = props.conversations.filter(
      (c) => c._id !== conversation._id
    );
    newConversations.unshift(updatedConversation);
    props.setConversations(newConversations);

    // Determine receiver
    let receiverId = '';
    if (conversation.type === "group") {
      receiverId = conversation.groupId?._id || '';
    } else {
      receiverId = (conversation.senderId?._id === user?._id)
        ? conversation.receiverId?._id
        : conversation.senderId?._id;
    }

    const eventData = {
      content,
      mediaFiles,
      type: conversation.type,
      conversationId: conversation._id,
      senderId: user?._id,
      nameSender: user?.name,
      receiverId: receiverId,
    };

    console.log('📡 [Messages] Emitting chat event with eventData:', eventData);
    const emitSuccess = emitEvent("chat", eventData);
    if (!emitSuccess) {
      console.error('❌ Failed to emit chat event - socket not connected');
    }
  }, [messages, conversation, props, user]);

  const handleReceiveMessage = useCallback((content) => {
    try {
      console.log('📨 Received message:', content)
      console.log('📎 MediaFiles in received message:', content.msg.mediaFiles)

      // Chỉ xử lý message nếu thuộc về cuộc trò chuyện hiện tại
      if (conservantRef.current && conservantRef.current.conversationId !== content.msg.conversationId) {
        console.log('⏭️ Message belongs to different conversation, skipping display');
        // Update conversation list only, don't display message
        let conversation = props.getConversation(conversationsRef.current, content.msg.conversationId);
        if (conversation) {
          conversation.lastMessageAt = Date.now();
          const newConversations = conversationsRef.current.filter(
            (c) => conversation._id !== c._id,
          );
          newConversations.unshift(conversation);
          props.setConversations(newConversations);
        }
        return;
      }

      const newMessage = {
        direction: "to",
        content: content.msg.content,
        senderId: content.msg.senderId,
        mediaFiles: content.msg.mediaFiles || []
      }
      console.log('📬 New message object created:', newMessage)
      const senderId = content.msg.senderId

      const username = content.msg.senderName
      let conversation = props.getConversation(conversationsRef.current, content.msg.conversationId)

      if (conversation) {
        let newMessages = [newMessage]
        if (messagesRef.current) {
          newMessages = [...messagesRef.current, newMessage]
        }

        setMessages(newMessages)

        if (conversation.new) {
          conversation.messages = newMessages
        }

        conversation.lastMessageAt = Date.now()
        const newConversations = conversationsRef.current.filter(
          (conversationCompare) => conversation._id !== conversationCompare._id,
        )
        newConversations.unshift(conversation)
        props.setConversations(newConversations)
      } else {
        console.log("No matching conversation found, creating new one. ", content.msg)
        const newConversation = {
          _id: content.msg.conversationId || null,
          type: "user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          groupId: content.msg.groupId || null,
          senderId: {
            _id: content.msg.senderId,
            name: content.msg.name || username || "Unknown",
            email: ""
          },
          receiverId: {
            _id: user?._id,
            name: user?.name || "",
            email: user?.email || ""
          },
          lastMessage: {
            content: content.msg.content,
            contentType: content.contentType || "text",
            createdAt: new Date().toISOString(),
            senderId: content.msg.senderId,
            senderName: content.msg.name || "Unknown"
          },
          unreadCount: 1,
          new: true,
          messages: [newMessage],
          lastMessageAt: Date.now(),
        }

        console.log("cuoc tro chuyen moi ", newConversation)
        props.setConversations([newConversation, ...conversationsRef.current])
      }

      scrollToBottom()
    } catch (err) {
      console.error("Lỗi khi xử lý tin nhắn:", err)
    }
  }, [user?.name, props, scrollToBottom]);


  const handleConversationCreated = useCallback(async (data) => {
    try {
      console.log('🔔 conversationCreated received:', data);

      const { conversationId, conversation: fullConversation } = data;

      if (!fullConversation) return;

      // If current conservant is in draft mode (no conversationId), update it
      if (props.conservant && !props.conservant.conversationId) {
        // Check if this conversation is for current conservant
        const isForCurrentConservant =
          (fullConversation.type === 'group' && props.conservant.isGroup &&
            fullConversation.groupId?.name === props.conservant.name) ||
          (fullConversation.type === 'user' && (
            fullConversation.receiverId?._id === props.conservant._id ||
            fullConversation.senderId?._id === props.conservant._id
          ));

        if (isForCurrentConservant) {
          // Update conservant with real conversationId
          props.setConservant({
            ...props.conservant,
            conversationId: conversationId
          });

          setLoading(false);
        }
      }

      // Always check and add conversation if not exists (regardless of conservant state)
      props.setConversations(prev => {
        // Remove temporary conversations
        const filtered = prev.filter(c => !c._isTemporary);

        // Check if conversation already exists
        const alreadyExists = filtered.some(c => c._id === conversationId);
        if (alreadyExists) {
          return filtered;
        }

        // Add new conversation
        return [fullConversation, ...filtered];
      });
    } catch (err) {
      console.error('Error handling conversationCreated:', err);
    }
  }, [props, setLoading])

  const handleSendListenerKeyBoard = useCallback((e) => {
    if (!conversation || !conversation._id) return;

    const isTemporary = conversation.new === true ||
      conversation._id?.startsWith('tmp-') ||
      conversation._id === null;
    if (isTemporary) return;

    const receiverId = (conversation.type === "group")
      ? conversation.groupId?._id
      : (conversation.senderId._id === user?._id)
        ? conversation.receiverId._id
        : conversation.senderId._id;

    const isTyping = e.target.value && e.target.value.trim().length > 0;

    emitEvent("typing", {
      userId: user?._id,
      userName: user?.name,
      type: conversation.type,
      receiverId: receiverId,
      typing: isTyping,
      conversationId: conversation._id,
    });
  }, [conversation, user]);

  const handleReciveListenerKeyBoard = useCallback((content) => {
    if (content) {

      if (content.typing === true || (content.userName && content.userId)) {
        setTypingUsers((prev) => {
          const existing = prev.find((u) => u.userId === content.userId)
          if (!existing && content.userId !== user._id) {
            return [...prev, { userId: content.userId, userName: content.userName || "Someone" }]
          }
          return prev
        })

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== content.userId))
        }, 3000)
      } else {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== content.userId))
      }
    } else {
      setTypingUsers([])
    }
  }, [user._id]);

  const handleUserOnline = useCallback((data) => {
    setOnlineUsers((prev) => {
      const existing = prev.find((u) => u.userId === data.userId)
      if (!existing) {
        return [...prev, data]
      }
      return prev
    })
  }, []);

  const handleUserOffline = useCallback((data) => {
    setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId))
  }, []);



  useEffect(() => {
    // console.log('🔌 Registering socket events in messages');

    onEvent("chat", handleReceiveMessage);
    onEvent("chat-group", handleReceiveMessage);
    onEvent("typing", handleReciveListenerKeyBoard);
    onEvent("user-online", handleUserOnline);
    onEvent("user-offline", handleUserOffline);
    onEvent("join-room", handleJoinRoom);
    onEvent('conversationCreated', handleConversationCreated)


    return () => {
      offEvent("chat", handleReceiveMessage);
      offEvent("chat-group", handleReceiveMessage);
      offEvent("typing", handleReciveListenerKeyBoard);
      offEvent("user-online", handleUserOnline);
      offEvent("user-offline", handleUserOffline);
      offEvent("join-room", handleJoinRoom);
      offEvent('conversationCreated', handleConversationCreated)


      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [handleReceiveMessage, handleReciveListenerKeyBoard, handleUserOnline, handleUserOffline]);

  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      @keyframes pulse {
        0%, 60%, 100% {
          transform: scale(1);
          opacity: 0.4;
        }
        30% {
          transform: scale(1.2);
          opacity: 1;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Check if current conversation is a group
  const isGroup = conversation?.type === "group" || props.conservant?.isGroup || false
  const groupMembers = props.conservant?.members || []
  const memberCount = groupMembers.length || 0

  const handleShowGroupInfo = useCallback(() => {
    setShowGroupInfo(true)
  }, []);

  const handleCloseGroupInfo = useCallback(() => {
    setShowGroupInfo(false)
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Không rõ"
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Không rõ"
    }
  }, []);

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.some((u) => u.userId === userId)
  }, [onlineUsers]);

  return props.conservant ? (
    <>
      {(conversation && messages) || loading === false ? (
        <>
          <HorizontalStack alignItems="center" justifyContent="space-between" sx={{ px: 2, height: "60px" }}>
            <HorizontalStack alignItems="center" spacing={2}>
              {props.mobile && (
                <IconButton onClick={() => props.setConservant(null)} sx={{ padding: 0 }}>
                  <AiFillCaretLeft />
                </IconButton>
              )}
              <Badge
                color="success"
                variant="dot"
                invisible={!isUserOnline(props.conservant._id)}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
              >
                <UserAvatar username={props.conservant.name} height={30} width={30} />
              </Badge>
              <Box>
                <Typography>
                  <Link to={"/users/" + props.conservant}>
                    <b>{props.conservant.name}</b>
                  </Link>
                </Typography>
                {isGroup && (
                  <Typography variant="caption" color="text.secondary">
                    {memberCount} thành viên
                  </Typography>
                )}
                {!isGroup && isUserOnline(props.conservant._id) && (
                  <Typography variant="caption" color="success.main">
                    Đang online
                  </Typography>
                )}
                {typingUsers.length > 0 && (
                  <Typography variant="caption" color="primary.main">
                    đang nhập...
                  </Typography>
                )}
              </Box>
            </HorizontalStack>

            <HorizontalStack spacing={1}>
              {/* Call buttons - only show for 1-on-1 conversations */}
              {!isGroup && (
                <CallButtons
                  receiverId={props.conservant._id}
                  receiverName={props.conservant.name}
                  receiverAvatar={props.conservant.avatar}
                  conversationId={props.conservant.conversationId}
                />
              )}

              {/* Group Info Button */}
              {isGroup && (
                <IconButton
                  onClick={handleShowGroupInfo}
                  sx={{
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: "primary.light",
                      color: "white",
                    },
                  }}
                  size="small"
                >
                  <InfoIcon />
                </IconButton>
              )}
            </HorizontalStack>
          </HorizontalStack>
          <Divider />
          <Box sx={{ height: "calc(100vh - 240px)" }}>
            <Box sx={{ height: "100%" }}>
              <Stack
                ref={messagesContainerRef}
                sx={{ padding: 2, overflowY: "auto", maxHeight: "100%" }}
                direction="column"
                onScroll={handleScroll}
              >
                {/* Typing Indicator trong khung chat */}
                {typingUsers.length > 0 && (
                  <Box sx={{ mb: 1, ml: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                        {typingUsers[0].userName?.charAt(0) || "?"}
                      </Avatar>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {typingUsers.length === 1
                            ? ` đang nhập`
                            : `đang nhập`}
                        </Typography>
                        <Stack direction="row" spacing={0.3} alignItems="center">
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                              animation: "pulse 1.5s infinite",
                            }}
                          />
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                              animation: "pulse 1.5s infinite 0.2s",
                            }}
                          />
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                              animation: "pulse 1.5s infinite 0.4s",
                            }}
                          />
                        </Stack>
                      </Stack>
                    </Stack>
                  </Box>
                )}

                {loadingMore && (
                  <Box sx={{ textAlign: "center", mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Đang tải thêm...</Typography>
                  </Box>
                )}
                {messages.map((message, i) => (
                  <Message
                    conservant={props.conservant}
                    message={message}
                    key={i}
                    isOnline={isUserOnline(message.senderId)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </Stack>
            </Box>
          </Box>
          <SendMessage
            conversationId={conversation?._id}
            onSendMessage={handleSendMessage}
            onSendKeyBoard={handleSendListenerKeyBoard}
            onRecevieKeyBoard={handleReciveListenerKeyBoard}
          />
          {/* {scrollToBottom()} */}
        </>
      ) : (
        <Stack sx={{ height: "100%" }} justifyContent="center">
          {console.log("Loading state in Messages component:", loading)}
          <Loading />
        </Stack>
      )}

      {/* Group Info Dialog */}
      <Dialog open={showGroupInfo} onClose={handleCloseGroupInfo} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <HorizontalStack alignItems="center" spacing={2}>
              {isGroup ? <GroupIcon color="primary" /> : <PersonIcon color="primary" />}
              <Typography variant="h6">{isGroup ? "Thông tin nhóm" : "Thông tin cuộc trò chuyện"}</Typography>
            </HorizontalStack>
            <IconButton onClick={handleCloseGroupInfo} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Group Basic Info */}
            <Box>
              <Typography variant="h6" gutterBottom>
                {props.conservant?.name || "Nhóm chat"}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip icon={<GroupIcon />} label={`${memberCount} thành viên`} color="primary" variant="outlined" />
                <Chip icon={<PersonIcon />} label="Nhóm" color="secondary" variant="outlined" />
              </Stack>
            </Box>

            {/* Online Members */}
            {onlineUsers.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Thành viên đang online ({onlineUsers.length})
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {onlineUsers.map((user, index) => (
                    <Chip key={user.userId} label={user.userName} size="small" color="success" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Group Description */}
            {props.conservant?.description && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Mô tả
                </Typography>
                <Typography variant="body2">{props.conservant.description}</Typography>
              </Box>
            )}

            {/* Creation Info */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Thông tin tạo nhóm
              </Typography>
              <Typography variant="body2">Tạo lúc: {formatDate(props.conservant?.createdAt)}</Typography>
              {props.conservant?.createdBy && (
                <Typography variant="body2">Tạo bởi: {props.conservant.createdBy.name || "Không rõ"}</Typography>
              )}
            </Box>

            {/* Members List */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Danh sách thành viên ({memberCount})
              </Typography>
              <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                {groupMembers.length > 0 ? (
                  groupMembers.map((member, index) => (
                    <ListItem key={member._id || index}>
                      <ListItemAvatar>
                        <Badge color="success" variant="dot" invisible={!isUserOnline(member._id)}>
                          <Avatar src={member.avatar}>{member.name?.charAt(0) || "?"}</Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText primary={member.name || "Không rõ tên"} secondary={member.email || ""} />
                      {member.isAdmin && <Chip label="Admin" size="small" color="primary" variant="outlined" />}
                      {isUserOnline(member._id) && (
                        <Chip label="Online" size="small" color="success" variant="outlined" />
                      )}
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="Không có thông tin thành viên"
                      secondary="Dữ liệu thành viên chưa được tải"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseGroupInfo} variant="outlined">
            Đóng
          </Button>
          <Button variant="contained" color="primary">
            Cài đặt nhóm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  ) : (
    <Stack sx={{ height: "100%" }} justifyContent="center" alignItems="center" spacing={2}>
      <AiFillMessage size={80} />
      <Typography variant="h5">JustVibing Messenger</Typography>
      <Typography color="text.secondary">Privately message other users on JustVibing</Typography>
    </Stack>
  )
}

export default React.memo(Messages)
