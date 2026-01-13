"use client"

import { useState } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material"
import { Security, Warning, CheckCircle, Block, Refresh, Delete, Add, Shield, Report } from "@mui/icons-material"

const AdminSecurity = () => {
  const [securityLogs, setSecurityLogs] = useState([
    {
      id: 1,
      type: "login_failed",
      user: "unknown@example.com",
      ip: "192.168.1.100",
      timestamp: "2024-03-15 14:30:25",
      severity: "medium",
      description: "Đăng nhập thất bại 5 lần liên tiếp",
    },
    {
      id: 2,
      type: "suspicious_activity",
      user: "user123",
      ip: "10.0.0.50",
      timestamp: "2024-03-15 13:15:10",
      severity: "high",
      description: "Truy cập bất thường từ địa chỉ IP mới",
    },
    {
      id: 3,
      type: "admin_access",
      user: "admin",
      ip: "192.168.1.1",
      timestamp: "2024-03-15 12:00:00",
      severity: "low",
      description: "Truy cập trang admin thành công",
    },
  ])

  const [blockedIPs, setBlockedIPs] = useState([
    { ip: "192.168.1.100", reason: "Brute force attack", blockedAt: "2024-03-15 14:35:00" },
    { ip: "10.0.0.99", reason: "Spam activities", blockedAt: "2024-03-14 16:20:00" },
  ])

  const [securitySettings, setSecuritySettings] = useState({
    enableTwoFactor: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30, // minutes
    requireStrongPassword: true,
    enableCaptcha: true,
    logSecurityEvents: true,
  })

  const [newIPDialog, setNewIPDialog] = useState(false)
  const [newBlockedIP, setNewBlockedIP] = useState("")
  const [blockReason, setBlockReason] = useState("")

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "error"
      case "medium":
        return "warning"
      case "low":
        return "success"
      default:
        return "default"
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "login_failed":
        return <Warning color="error" />
      case "suspicious_activity":
        return <Report color="warning" />
      case "admin_access":
        return <Shield color="success" />
      default:
        return <Security />
    }
  }

  const handleBlockIP = () => {
    if (newBlockedIP.trim() && blockReason.trim()) {
      const newBlock = {
        ip: newBlockedIP.trim(),
        reason: blockReason.trim(),
        blockedAt: new Date().toLocaleString("sv-SE"),
      }
      setBlockedIPs([...blockedIPs, newBlock])
      setNewBlockedIP("")
      setBlockReason("")
      setNewIPDialog(false)
    }
  }

  const handleUnblockIP = (ip) => {
    setBlockedIPs(blockedIPs.filter((blocked) => blocked.ip !== ip))
  }

  const handleSettingChange = (key, value) => {
    setSecuritySettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Bảo mật & Giám sát
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} size="small">
          Làm mới logs
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* Security Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tình trạng bảo mật
              </Typography>

              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2">SSL Certificate</Typography>
                  </Stack>
                  <Chip label="Active" color="success" size="small" />
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2">Firewall</Typography>
                  </Stack>
                  <Chip label="Enabled" color="success" size="small" />
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Warning color="warning" fontSize="small" />
                    <Typography variant="body2">Failed Logins</Typography>
                  </Stack>
                  <Chip label="3 today" color="warning" size="small" />
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Block color="error" fontSize="small" />
                    <Typography variant="body2">Blocked IPs</Typography>
                  </Stack>
                  <Chip label={blockedIPs.length} color="error" size="small" />
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Cài đặt bảo mật
              </Typography>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.enableTwoFactor}
                      onChange={(e) => handleSettingChange("enableTwoFactor", e.target.checked)}
                    />
                  }
                  label="Xác thực 2 bước"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.requireStrongPassword}
                      onChange={(e) => handleSettingChange("requireStrongPassword", e.target.checked)}
                    />
                  }
                  label="Yêu cầu mật khẩu mạnh"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.enableCaptcha}
                      onChange={(e) => handleSettingChange("enableCaptcha", e.target.checked)}
                    />
                  }
                  label="Bật CAPTCHA"
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Số lần đăng nhập sai tối đa"
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange("maxLoginAttempts", Number.parseInt(e.target.value))}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Thời gian session (phút)"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSettingChange("sessionTimeout", Number.parseInt(e.target.value))}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Logs */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Nhật ký bảo mật
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Loại</TableCell>
                      <TableCell>Người dùng</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Thời gian</TableCell>
                      <TableCell>Mức độ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {securityLogs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {getTypeIcon(log.type)}
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {log.type.replace("_", " ")}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {log.description}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {log.ip}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.timestamp}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={log.severity} color={getSeverityColor(log.severity)} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  IP bị chặn
                </Typography>
                <Button size="small" startIcon={<Add />} onClick={() => setNewIPDialog(true)}>
                  Chặn IP
                </Button>
              </Stack>

              <List>
                {blockedIPs.map((blocked, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <Block color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                          {blocked.ip}
                        </Typography>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="caption">Lý do: {blocked.reason}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Chặn lúc: {blocked.blockedAt}
                          </Typography>
                        </Stack>
                      }
                    />
                    <IconButton size="small" onClick={() => handleUnblockIP(blocked.ip)} color="primary">
                      <Delete />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Block IP Dialog */}
      <Dialog open={newIPDialog} onClose={() => setNewIPDialog(false)}>
        <DialogTitle>Chặn địa chỉ IP</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Địa chỉ IP"
              value={newBlockedIP}
              onChange={(e) => setNewBlockedIP(e.target.value)}
              placeholder="192.168.1.100"
            />
            <TextField
              fullWidth
              label="Lý do chặn"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Spam, brute force attack, etc."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewIPDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleBlockIP}>
            Chặn IP
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminSecurity
