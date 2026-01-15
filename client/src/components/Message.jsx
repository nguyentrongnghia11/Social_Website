import { Avatar, Card, useTheme, Typography, Box, Dialog, DialogContent, DialogActions, IconButton } from "@mui/material";
import { Phone, Videocam, AttachFile, Image as ImageIcon, VideoFile, AudioFile, PictureAsPdf, Description, Close as CloseIcon, ZoomIn } from "@mui/icons-material";
import React, { useState } from "react";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";

const Message = (props) => {
  const conservant = props.conservant || {};
  const username = conservant.name;
  const message = props.message;
  const theme = useTheme();
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  console.log('🎨 Message component rendering with:', { 
    content: message?.content, 
    mediaFiles: message?.mediaFiles,
    mediaFilesLength: message?.mediaFiles?.length 
  });

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenImageModal(true);
  };

  const handleCloseModal = () => {
    setOpenImageModal(false);
    setSelectedImage(null);
  };

  // Compute display name: if name has 3 or more parts, show the last part
  const rawName = (message?.senderId && message.senderId.name) || username || "";
  const nameParts = rawName.trim().split(/\s+/).filter(Boolean);
  const displayName = nameParts.length >= 3 ? nameParts[nameParts.length - 1] : rawName;

  const getFileIcon = (resourceType, format) => {
    if (resourceType === 'image') return <ImageIcon />;
    if (resourceType === 'video') return <VideoFile />;
    if (resourceType === 'audio') return <AudioFile />;
    if (format === 'pdf') return <PictureAsPdf />;
    return <Description />;
  };

  const renderMediaFile = (file, index) => {
    const isImage = file.resourceType === 'image';
    const isVideo = file.resourceType === 'video';
    const isAudio = file.resourceType === 'audio';

    if (isImage) {
      return (
        <Box
          key={index}
          onClick={() => handleImageClick(file.url)}
          sx={{
            position: 'relative',
            cursor: 'pointer',
            borderRadius: '8px',
            overflow: 'hidden',
            maxWidth: '300px',
            mt: 1,
            '&:hover .image-overlay': { 
              opacity: 1 
            },
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <img
            src={file.url}
            alt={file.fileName}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
          <Box
            className="image-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.3s ease',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: 50,
                height: 50,
              }}
            >
              <ZoomIn sx={{ color: 'white', fontSize: 24 }} />
            </Box>
          </Box>
        </Box>
      );
    }

    if (isVideo) {
      return (
        <Box key={index} sx={{ mt: 1, maxWidth: '300px' }}>
          <video
            controls
            style={{
              width: '100%',
              borderRadius: '8px',
            }}
          >
            <source src={file.url} type={`video/${file.format}`} />
          </video>
        </Box>
      );
    }

    if (isAudio) {
      return (
        <Box key={index} sx={{ mt: 1, maxWidth: '300px' }}>
          <audio
            controls
            style={{ width: '100%' }}
          >
            <source src={file.url} type={`audio/${file.format}`} />
          </audio>
        </Box>
      );
    }

    return (
      <Box
        key={index}
        component="a"
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mt: 1,
          p: 1,
          borderRadius: '8px',
          bgcolor: 'action.hover',
          textDecoration: 'none',
          color: 'inherit',
          '&:hover': {
            bgcolor: 'action.selected',
          },
        }}
      >
        {getFileIcon(file.resourceType, file.format)}
        <Typography variant="body2" sx={{ flex: 1 }}>
          {file.fileName}
        </Typography>
      </Box>
    );
  };


  let styles = {};
  if (message.direction === "to") {
    styles = {
      justifyContent: "flex-start",
    };
  } else if (message.direction === "from") {
    styles = {
      messageColor: theme.palette.grey["100"],
      justifyContent: "flex-end",
    };
  }

  return (
    <HorizontalStack
      sx={{ paddingY: 1, width: "100%" }}
      spacing={2}
      justifyContent={styles.justifyContent}
      alignItems="flex-end"
    >
      {message.direction === "to" && (
        <UserAvatar username={message.senderId._id} height={30} width={30} />
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: message.direction === "to" ? "flex-start" : "flex-end",
          width: "100%",
        }}
      >
        {message.direction === "to" && (
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, ml: 2 }}>
            {displayName}
          </Typography>
        )}

        <Card
          sx={{
            display: "inline-block",
            borderRadius: "25px",
            backgroundColor: styles.messageColor,
            borderWidth: "1px",
            paddingY: "12px",
            /* leave space for avatar on the left */
            maxWidth: "calc(100% - 80px)",
            minWidth: 120,
            paddingX: 2,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {message.callType && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: message.content ? 1 : 0 }}>
              {message.callType === "video" ? (
                <Videocam sx={{ fontSize: 20 }} />
              ) : (
                <Phone sx={{ fontSize: 20 }} />
              )}
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {message.callType === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại"}
              </Typography>
            </Box>
          )}
          {message.content && <Box>{message.content}</Box>}
          {message.mediaFiles && message.mediaFiles.length > 0 && (
            <Box sx={{ mt: message.content ? 1 : 0 }}>
              {message.mediaFiles.map((file, index) => renderMediaFile(file, index))}
            </Box>
          )}
        </Card>
      </div>

      {/* Image Modal */}
      <Dialog
        open={openImageModal}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            boxShadow: 'none',
          }
        }}
      >
        <DialogActions sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
          <IconButton onClick={handleCloseModal} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogActions>
        <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </HorizontalStack>
  );
};

export default Message;
