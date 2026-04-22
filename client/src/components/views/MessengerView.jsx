"use client"

import { Card, Grid } from "@mui/material"
import { Box, Container } from "@mui/system"
import { useEffect, useState, useCallback } from "react"
import Messages from "../Messages"
import Navbar from "../Navbar"
import UserMessengerEntries from "../UserMessengerEntries"
import { getAllConversationOfUser } from "../../api-axios/conservation"
import { isLoggedIn } from "../../helpers/authHelper"
import { useLocation } from "react-router-dom"

const MessengerView = () => {
  const [conservant, setConservant] = useState(null)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [width, setWindowWidth] = useState(0)
  const [selected, setSelected] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const mobile = width < 800
  const user = isLoggedIn()
  const { state } = useLocation()
  const newConservant = state && state.user


  const getConversation = (conversations, conversationId) => {
    if (!conversations || conversations.length <= 0 || !conversationId) {
      return null
    }
    return conversations.find(c => c && c._id === conversationId) || null
  }

  const fetchConversations2 = useCallback(async () => {
    const response = await getAllConversationOfUser()
    let conver = response.result.conversations || []

    conver.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || a.updatedAt || a.createdAt
      const timeB = b.lastMessage?.createdAt || b.updatedAt || b.createdAt
      return new Date(timeB) - new Date(timeA)
    })

    if (newConservant) {
      const existing = conver.find(c =>
        c.type === "user" &&
        Array.isArray(c.participants) &&
        c.participants.some(p => p?._id?.toString() === newConservant._id?.toString())
      )

      if (existing) {
        // Model mới: lấy participant khác với current user
        const recipientParticipant = existing.participants?.find(
          p => p?._id?.toString() !== user?.user?._id?.toString()
        ) || existing.participants?.[0];
        setConservant({ ...recipientParticipant, conversationId: existing._id })
      } else {
        // Tạo cuộc trò chuyỬn ảo với cấu trúc model mới
        const myInfo = {
          _id: user?.user?._id,
          name: user?.user?.name || "",
          avt_url: user?.user?.avt_url || ""
        };
        const otherInfo = {
          _id: newConservant._id,
          name: newConservant.name || "",
          avt_url: newConservant.avt_url || newConservant.avatar || ""
        };
        const tempConversation = {
          _id: `temp-${newConservant._id}`,
          _isTemporary: true,
          type: "user",
          participantIds: [user?.user?._id, newConservant._id],
          participants: [myInfo, otherInfo],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        conver = [tempConversation, ...conver]
        setConservant({ ...otherInfo, conversationId: null })
      }
    }
    
    setConversations(conver)
    setLoading(false)
  }, [newConservant, user])

  const handleCreateGroup = () => {
    setShowCreateGroup(true)
  }

  const handleCloseCreateGroup = () => {
    setShowCreateGroup(false)
  }

  const handleGroupCreated = (groupData) => {
    // Chờ conversation thật từ socket conversationCreated event
    // Set conservant để chuẩn bị UI, conversation sẽ được add khi nhận socket event
    setConservant({
      ...groupData.newGroup,
      conversationId: null 
    })
    setShowCreateGroup(false)
  }

  useEffect(() => {
    fetchConversations2()
  }, [])

  useEffect(() => {
    updateDimensions()

    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const updateDimensions = () => {
    const width = window.innerWidth
    setWindowWidth(width)
  }

  return (
    <Container>
      <Navbar />
      <Box>
        <Card sx={{ padding: 0 }}>
          <Grid container sx={{ height: "calc(100vh - 110px)" }} alignItems="stretch">
            {!mobile ? (
              <>
                <Grid
                  size={{ xs: 12, md: 5 }}
                  sx={{
                    borderRight: 1,
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <UserMessengerEntries
                    conservant={conservant}
                    conversations={conversations}
                    setConversations={setConversations}
                    setConservant={setConservant}
                    loading={loading}
                    selected={selected}
                    setSelected={setSelected}
                    onCreateGroup={handleCreateGroup}
                    showCreateGroup={showCreateGroup}
                    onCloseCreateGroup={handleCloseCreateGroup}
                    onGroupCreated={handleGroupCreated}
                    setShowCreateGroup={setShowCreateGroup}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 7 }} sx={{ height: "100%" }}>
                  <Messages
                    conservant={conservant}
                    conversations={conversations}
                    setConservant={setConservant}
                    setConversations={setConversations}
                    getConversation={getConversation}
                    selected={selected}
                  />
                </Grid>
              </>
            ) : !conservant ? (
              <Grid
                size={12}
                sx={{
                  borderRight: 1,
                  borderColor: "divider",
                  height: "100%",
                }}
              >
                <UserMessengerEntries
                  conservant={conservant}
                  conversations={conversations}
                  setConservant={setConservant}
                  loading={loading}
                  onCreateGroup={handleCreateGroup}
                  showCreateGroup={showCreateGroup}
                  onCloseCreateGroup={handleCloseCreateGroup}
                  onGroupCreated={handleGroupCreated}
                  setShowCreateGroup={setShowCreateGroup}
                />
                <Box sx={{ display: "none" }}>
                  <Messages
                    conservant={conservant}
                    conversations={conversations}
                    setConservant={setConservant}
                    setConversations={setConversations}
                    getConversation={getConversation}
                  />
                </Box>
              </Grid>
            ) : (
              <Grid size={12} sx={{ height: "100%" }}>
                <Messages
                  conservant={conservant}
                  conversations={conversations}
                  setConservant={setConservant}
                  setConversations={setConversations}
                  getConversation={getConversation}
                  mobile
                />
              </Grid>
            )}
          </Grid>
        </Card>
      </Box>
    </Container>
  )
}

export default MessengerView
