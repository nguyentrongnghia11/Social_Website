"use client"

import { TextField, Stack, IconButton, InputAdornment, Chip, Box, CircularProgress } from "@mui/material"
import { useState, useRef, useEffect } from "react"
import { Send as SendIcon, AttachFile as AttachFileIcon, EmojiEmotions as EmojiIcon, Close as CloseIcon } from "@mui/icons-material"
import HorizontalStack from "./util/HorizontalStack"
import { getUploadSignature, uploadToS3 } from "../api-axios/messages"

const SendMessage = (props) => {
  const [content, setContent] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const handleSendMessage = async () => {
    if (content.trim().length > 0 || selectedFiles.length > 0) {
      setUploading(true)
      try {
        let mediaFiles = []

        // Upload files nếu có
        if (selectedFiles.length > 0) {
          // Xác định fileType từ file đầu tiên
          const firstFile = selectedFiles[0]
          let fileType = 'image'
          if (firstFile.type.startsWith('video/')) {
            fileType = 'video'
          } else if (firstFile.type.startsWith('audio/')) {
            fileType = 'audio'
          } else if (firstFile.type.includes('pdf') || firstFile.type.includes('document')) {
            fileType = 'document'
          }

          const signature = await getUploadSignature(
            props.conversationId,
            selectedFiles.length,
            fileType
          )

          // signature.data.presignedUrls is an array of presigned URL objects
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i]
            const presignedUrl = signature.data.presignedUrls[i]

            const result = await uploadToS3(file, presignedUrl)
            mediaFiles.push({
              url: result.url,
              key: result.key,
              resourceType: result.type,
              fileName: file.name,
              fileSize: result.size
            })
          }
          console.log('☁️ [SendMessage] Uploaded files to S3:', mediaFiles)
        }

        console.log('📤 [SendMessage] Calling onSendMessage with:', { content: content.trim(), mediaFiles })
        // Clear typing indicator when sending message
        props.onSendMessage(content.trim(), mediaFiles)
        setContent("")
        setSelectedFiles([])
        inputRef.current?.focus()
      } catch (error) {
        console.error("Error uploading files:", error)
        alert("Không thể tải file lên. Vui lòng thử lại!")
      } finally {
        setUploading(false)
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setContent(newValue)

    // Trigger typing indicator logic
    if (props.onSendKeyBoard) {
      props.onSendKeyBoard(e)
    }
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Handle paste events
  const handlePaste = (e) => {
    // Allow default paste behavior
    setTimeout(() => {
      if (props.onSendKeyBoard) {
        props.onSendKeyBoard({
          target: { value: inputRef.current?.value || "" },
        })
      }
    }, 0)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Stack
      sx={{
        m: 2,
        minHeight: "60px",
      }}
      justifyContent="center"
    >
      {selectedFiles.length > 0 && (
        <Box sx={{ mb: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {selectedFiles.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              onDelete={() => handleRemoveFile(index)}
              deleteIcon={<CloseIcon />}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
      <HorizontalStack spacing={1}>
        <TextField
          ref={inputRef}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onPaste={handlePaste}
          label="Nhập tin nhắn..."
          fullWidth
          value={content}
          autoComplete="off"
          size="small"
          multiline
          maxRows={4}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  color="primary"
                  sx={{
                    opacity: 0.7,
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <EmojiIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handleAttachClick}
                  disabled={uploading}
                  sx={{
                    opacity: 0.7,
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <AttachFileIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "20px",
              transition: "all 0.2s ease",
              "&:hover": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
              },
              "&.Mui-focused": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderWidth: "2px",
                },
              },
            },
          }}
          placeholder="Nhập tin nhắn..."
        />

        <IconButton
          onClick={handleSendMessage}
          disabled={content.trim().length === 0 && selectedFiles.length === 0 || uploading}
          color="primary"
          sx={{
            bgcolor: (content.trim().length > 0 || selectedFiles.length > 0) && !uploading ? "primary.main" : "grey.300",
            color: (content.trim().length > 0 || selectedFiles.length > 0) && !uploading ? "white" : "grey.500",
            "&:hover": {
              bgcolor: (content.trim().length > 0 || selectedFiles.length > 0) && !uploading ? "primary.dark" : "grey.400",
              transform: (content.trim().length > 0 || selectedFiles.length > 0) && !uploading ? "scale(1.05)" : "none",
            },
            "&:disabled": {
              bgcolor: "grey.300",
              color: "grey.500",
            },
            width: 40,
            height: 40,
            transition: "all 0.2s ease",
          }}
        >
          {uploading ? <CircularProgress size={20} /> : <SendIcon />}
        </IconButton>
      </HorizontalStack>
    </Stack>
  )
}

export default SendMessage
