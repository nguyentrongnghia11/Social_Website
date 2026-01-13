import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { instance } from "../../config";
import { Typography, Box, CircularProgress } from "@mui/material";

export default function ReadConversationView() {
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      instance.post(`/conversations/${id}/read`).catch(() => {});
    }
  }, [id]);

  return (
    <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6">Đang đánh dấu đã đọc hội thoại...</Typography>
    </Box>
  );
}
