import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Dashboard,
  People,
  Article,
  Report,
  Analytics,
  Settings,
  Security,
  Assignment,
  ExitToApp,
  Menu as MenuIcon,
  Notifications,
  AccountCircle
} from '@mui/icons-material';
import { AiFillFileText } from 'react-icons/ai';
import { Box, IconButton, Badge, Menu, MenuItem, Avatar } from '@mui/material';
import 'admin-lte/dist/css/adminlte.min.css';
import './admin.css';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const menuItems = [
    { path: '/admin', icon: <Dashboard />, label: 'Tổng quan', exact: true },
    { path: '/admin/users', icon: <People />, label: 'Quản lý Người dùng' },
    { path: '/admin/content', icon: <Article />, label: 'Quản lý Nội dung' },
    { path: '/admin/reports', icon: <Report />, label: 'Báo cáo Vi phạm' },
    { path: '/admin/analytics', icon: <Analytics />, label: 'Thống kê & Phân tích' },
    { path: '/admin/settings', icon: <Settings />, label: 'Cấu hình Hệ thống' },
    { path: '/admin/security', icon: <Security />, label: 'Bảo mật & Logs' },
  ];

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`wrapper ${sidebarCollapsed ? 'sidebar-collapse' : ''}`}>
      {/* Navbar */}
      <nav className="main-header navbar navbar-expand navbar-white navbar-light">
        {/* Left navbar links */}
        <ul className="navbar-nav">
          <li className="nav-item">
            <a 
              className="nav-link" 
              data-widget="pushmenu"
              role="button" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ cursor: 'pointer' }}
            >
              <MenuIcon />
            </a>
          </li>
          <li className="nav-item d-none d-sm-inline-block">
            <Link to="/" className="nav-link">Trang chủ</Link>
          </li>
        </ul>

        {/* Right navbar links */}
        <ul className="navbar-nav ml-auto">
          {/* Notifications */}
          <li className="nav-item dropdown">
            <a className="nav-link" role="button" style={{ cursor: 'pointer' }}>
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </a>
          </li>

          {/* User Menu */}
          <li className="nav-item dropdown">
            <a 
              className="nav-link"
              role="button"
              onClick={handleProfileMenuOpen}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
            </a>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>
                <AccountCircle sx={{ mr: 1 }} /> Hồ sơ
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} /> Đăng xuất
              </MenuItem>
            </Menu>
          </li>
        </ul>
      </nav>

      {/* Main Sidebar */}
      <aside className="main-sidebar sidebar-light-primary elevation-4">
        {/* Brand Logo */}
        <Link to="/admin" className="brand-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AiFillFileText size={28} color="#1976d2" />
          <span className="brand-text font-weight-light" style={{ color: '#1976d2' }}>
            <strong>Mind</strong>Share Admin
          </span>
        </Link>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Sidebar Menu */}
          <nav className="mt-2">
            <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
              {menuItems.map((item) => (
                <li key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
                  >
                    <Box component="i" className="nav-icon">
                      {item.icon}
                    </Box>
                    <p>{item.label}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className="content-wrapper">
        {/* Content Header (Page header) */}
        <section className="content-header">
          <div className="container-fluid">
            {/* Page content will be rendered here */}
          </div>
        </section>

        {/* Main content */}
        <section className="content">
          <div className="container-fluid">
            <Outlet />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="main-footer">
        <strong>Copyright &copy; 2024 MindShare.</strong> All rights reserved.
        <div className="float-right d-none d-sm-inline-block">
          <b>Version</b> 1.0.0
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;
