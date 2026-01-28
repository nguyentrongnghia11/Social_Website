"use client"

import { useState } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"
import { Save, Refresh, Delete, Add, Edit, Security, Notifications, Storage, Speed } from "@mui/icons-material"

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: "JustVibing",
    siteDescription: "Nền tảng chia sẻ kiến thức và kết nối cộng đồng",
    allowRegistration: true,
    requireEmailVerification: true,
    moderateComments: false,
    allowFileUploads: true,
    maxFileSize: 10, // MB
    enableNotifications: true,
    maintenanceMode: false,
    cacheEnabled: true,
    analyticsEnabled: true,
  })

  const [categories, setCategories] = useState([
    { id: 1, name: "Technology", color: "primary", postCount: 234 },
    { id: 2, name: "Lifestyle", color: "secondary", postCount: 156 },
    { id: 3, name: "Education", color: "success", postCount: 89 },
    { id: 4, name: "Business", color: "warning", postCount: 67 },
  ])

  const [newCategory, setNewCategory] = useState("")
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = () => {
    // Simulate API call
    setTimeout(() => {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 1000)
  }

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const newCat = {
        id: Date.now(),
        name: newCategory.trim(),
        color: "primary",
        postCount: 0,
      }
      setCategories([...categories, newCat])
      setNewCategory("")
      setCategoryDialogOpen(false)
    }
  }

  const handleDeleteCategory = (id) => {
    setCategories(categories.filter((cat) => cat.id !== id))
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Cài đặt hệ thống
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Refresh />} size="small">
            Khôi phục mặc định
          </Button>
          <Button variant="contained" startIcon={<Save />} size="small" onClick={handleSaveSettings}>
            Lưu thay đổi
          </Button>
        </Stack>
      </Stack>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Cài đặt đã được lưu thành công!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Security color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Cài đặt chung
                </Typography>
              </Stack>

              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Tên website"
                  value={settings.siteName}
                  onChange={(e) => handleSettingChange("siteName", e.target.value)}
                />

                <TextField
                  fullWidth
                  label="Mô tả website"
                  multiline
                  rows={3}
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowRegistration}
                      onChange={(e) => handleSettingChange("allowRegistration", e.target.checked)}
                    />
                  }
                  label="Cho phép đăng ký tài khoản mới"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireEmailVerification}
                      onChange={(e) => handleSettingChange("requireEmailVerification", e.target.checked)}
                    />
                  }
                  label="Yêu cầu xác thực email"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.moderateComments}
                      onChange={(e) => handleSettingChange("moderateComments", e.target.checked)}
                    />
                  }
                  label="Kiểm duyệt bình luận"
                />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Storage color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Cài đặt file & media
                </Typography>
              </Stack>

              <Stack spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowFileUploads}
                      onChange={(e) => handleSettingChange("allowFileUploads", e.target.checked)}
                    />
                  }
                  label="Cho phép tải lên file"
                />

                <TextField
                  fullWidth
                  label="Kích thước file tối đa (MB)"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => handleSettingChange("maxFileSize", Number.parseInt(e.target.value))}
                  disabled={!settings.allowFileUploads}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Notifications color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Cài đặt thông báo & hiệu suất
                </Typography>
              </Stack>

              <Stack spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableNotifications}
                      onChange={(e) => handleSettingChange("enableNotifications", e.target.checked)}
                    />
                  }
                  label="Bật thông báo hệ thống"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.cacheEnabled}
                      onChange={(e) => handleSettingChange("cacheEnabled", e.target.checked)}
                    />
                  }
                  label="Bật cache để tăng tốc"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.analyticsEnabled}
                      onChange={(e) => handleSettingChange("analyticsEnabled", e.target.checked)}
                    />
                  }
                  label="Bật phân tích dữ liệu"
                />

                <Divider />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleSettingChange("maintenanceMode", e.target.checked)}
                      color="warning"
                    />
                  }
                  label="Chế độ bảo trì"
                />

                {settings.maintenanceMode && (
                  <Alert severity="warning">Khi bật chế độ bảo trì, chỉ admin mới có thể truy cập website.</Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Speed color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Danh mục bài viết
                  </Typography>
                </Stack>
                <Button size="small" startIcon={<Add />} onClick={() => setCategoryDialogOpen(true)}>
                  Thêm danh mục
                </Button>
              </Stack>

              <List>
                {categories.map((category) => (
                  <ListItem key={category.id} divider>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip label={category.name} color={category.color} size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {category.postCount} bài viết
                          </Typography>
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingCategory(category)
                          setCategoryDialogOpen(true)
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteCategory(category.id)} color="error">
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)}>
        <DialogTitle>{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Tên danh mục"
            value={editingCategory ? editingCategory.name : newCategory}
            onChange={(e) => {
              if (editingCategory) {
                setEditingCategory({ ...editingCategory, name: e.target.value })
              } else {
                setNewCategory(e.target.value)
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCategoryDialogOpen(false)
              setEditingCategory(null)
              setNewCategory("")
            }}
          >
            Hủy
          </Button>
          <Button variant="contained" onClick={handleAddCategory}>
            {editingCategory ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminSettings
