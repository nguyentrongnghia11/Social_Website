import React from "react";
import { Box, Container, Typography, Button, Stack, Paper, CircularProgress } from "@mui/material";
import { CloudOff, Refresh } from "@mui/icons-material";

const ServerDownPage = ({ onRetry, isRetrying = false }) => {
  // Hàm kiểm tra server đã lên chưa
  const checkServerAndRedirect = async () => {
    try {
      // Gọi thử API đơn giản, ví dụ /api/notification/all
      const res = await fetch("/api/notification/all");
      if (res.ok) {
        window.location.href = "/";
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Không set background ở đây, dùng background mặc định của body
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.93)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: theme => theme.palette.primary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: 4,
                mb: 1,
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%": { transform: "scale(1)", opacity: 1 },
                  "50%": { transform: "scale(1.06)", opacity: 0.88 },
                  "100%": { transform: "scale(1)", opacity: 1 },
                },
              }}
            >
              <CloudOff sx={{ fontSize: 70, color: "#fff" }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              Không thể kết nối máy chủ
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420 }}>
              Hệ thống hiện không thể kết nối tới máy chủ.<br />
              <b>Vui lòng kiểm tra lại kết nối mạng</b> hoặc thử tải lại trang.<br />
              Nếu bạn đang sử dụng VPN, hãy thử tắt VPN.<br />
              <span style={{ color: '#667eea' }}>Chúng tôi xin lỗi vì sự bất tiện này!</span>
            </Typography>
            <Box sx={{ mt: 2 }}>
              {isRetrying ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={24} color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Đang thử kết nối lại...
                  </Typography>
                </Stack>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<Refresh />}
                  onClick={checkServerAndRedirect}
                  sx={{
                    px: 5,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1.08rem",
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    boxShadow: 2,
                  }}
                >
                  Tải lại trang
                </Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
              Nếu sự cố kéo dài, vui lòng liên hệ hỗ trợ: <b>support@mindshare.vn</b> hoặc gọi <b>1900-xxxx</b>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ServerDownPage;
              
