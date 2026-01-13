import { Avatar, Card, useTheme, Typography, Box } from "@mui/material";
import { Phone, Videocam, AttachFile, Image as ImageIcon, VideoFile, AudioFile, PictureAsPdf, Description } from "@mui/icons-material";
import React from "react";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";

const Message = (props) => {
  const conservant = props.conservant || {};
  const username = conservant.name;
  const message = props.message;
  const theme = useTheme();

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
          component="a"
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'block',
            borderRadius: '8px',
            overflow: 'hidden',
            maxWidth: '300px',
            mt: 1,
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
    </HorizontalStack>
  );
};

export default Message;
