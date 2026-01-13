"use client"

import  React from "react"

import { useState, useEffect } from "react"
import { Container, Typography, Box, Tabs, Tab, Card, Stack, Button, Alert, Chip } from "@mui/material"
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { isLoggedIn } from "../helpers/authHelper"
import AdminOverview from "./AdminOverview"
import AdminUsers from "./AdminUsers"
import AdminPosts from "./AdminPosts"
import AdminAnalytics from "./AdminAnalytics"
import AdminSettings from "./AdminSettings"
import AdminSecurity from "./AdminSecurity"
import Navbar from "./Navbar"



function TabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index) {
  return {
    id: `admin-tab-${index}`,
    "aria-controls": `admin-tabpanel-${index}`,
  }
}

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const navigate = useNavigate()
  const user = isLoggedIn()

  useEffect(() => {
    // Check admin access
    // if (!user) {
    //   navigate("/login")
    //   return
    // }

    // // Check if user is admin (adjust this logic based on your auth system)
    // const isAdmin = user.isAdmin || user.role === "admin" || user.username === "trongnghia"

    // if (!isAdmin) {
    //   navigate("/")
    //   return
    // }

    setHasAccess(true)
    setLoading(false)
  }, [user, navigate])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    )
  }

  if (!hasAccess) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>You don't have permission to access the admin panel.</Typography>
          <Button onClick={() => navigate("/")} sx={{ mt: 2 }}>
            Go Home
          </Button>
        </Alert>
      </Container>
    )
  }

  const tabs = [
    { label: "Dashboard", icon: <DashboardIcon /> },
    { label: "Users", icon: <PeopleIcon /> },
    { label: "Posts", icon: <ArticleIcon /> },
    { label: "Analytics", icon: <AnalyticsIcon /> },
    { label: "Settings", icon: <SettingsIcon /> },
    { label: "Security", icon: <SecurityIcon /> },
  ]

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar />

      <Container
        maxWidth="xl"
        sx={{
          py: 3,
          px: { xs: 2, sm: 3, md: 4 },
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, {user?.name || user?.username}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip label="Admin" color="primary" variant="filled" sx={{ fontWeight: 600 }} />
            <Chip label="Online" color="success" variant="outlined" size="small" />
          </Stack>
        </Stack>

        {/* Navigation Tabs */}
        <Card
          sx={{
            mb: 3,
            width: "100%",
            overflow: "hidden",
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 64,
                "& .MuiTab-root": {
                  minHeight: 64,
                  textTransform: "none",
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  fontWeight: 500,
                  minWidth: { xs: 120, sm: 140 },
                  px: { xs: 1, sm: 2 },
                },
                "& .MuiTabs-scrollButtons": {
                  "&.Mui-disabled": {
                    opacity: 0.3,
                  },
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab key={index} icon={tab.icon} label={tab.label} iconPosition="start" {...a11yProps(index)} />
              ))}
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <TabPanel value={tabValue} index={0}>
              <AdminOverview />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <AdminUsers />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <AdminPosts />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <AdminAnalytics />
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              <AdminSettings />
            </TabPanel>
            <TabPanel value={tabValue} index={5}>
              <AdminSecurity />
            </TabPanel>
          </Box>
        </Card>
      </Container>
    </Box>
  )
}

export default AdminDashboard
