import "@mui/material";
import "react-icons";
import "react-icons/bi";
import "react-icons/md";
import "react-icons/bs";
import "react-router-dom";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import {
  BrowserRouter,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from "react-router-dom";
import theme from "./theme";

import PostView from "./components/views/PostView";
import CreatePostView from "./components/views/CreatePostView";
import ProfileView from "./components/views/ProfileView";
import LoginView from "./components/views/LoginView";
import SignupView from "./components/views/SignupView";
import ExploreView from "./components/views/ExploreView";
import PrivateRoute from "./components/PrivateRoute";
import SearchView from "./components/views/SearchView";
import MessengerView from "./components/views/MessengerView";
import GoogleCallbackView from "./components/views/GoogleCallbackView";
import { initiateSocketConnection, socket, onServerDown } from "./helpers/socketHelper";
import { useEffect, useState } from "react";
import { BASE_URL } from "./config";
import { io } from "socket.io-client";
import './api-axios/common'
import OTPView from "./components/views/OTPView";
import { isLoggedIn, validateSession } from "./helpers/authHelper";
import { NotificationProvider } from "./components/views/NotificationProvider";
import { generateDeviceId } from "./helpers/initDevice";
import AdminPage from "./components/views/DashBoardView";
import { VideoCallProvider, useVideoCall } from "./components/util/VideoCallContext";
import IncomingCallModal from "./components/IncomingCallModal";
import VideoCall from "./components/VideoCall";
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverviewPage from "./components/admin/AdminOverviewPage";
import AdminUsersPage from "./components/admin/AdminUsersPage";
import AdminContentPage from "./components/admin/AdminContentPage";
import AdminReportsPage from "./components/admin/AdminReportsPage";
import AdminAnalyticsPage from "./components/admin/AdminAnalyticsPage";
import AdminBannersPage from "./components/admin/AdminBannersPage";
import AdminSettingsPage from "./components/admin/AdminSettingsPage";
import AdminSecurityPage from "./components/admin/AdminSecurityPage";
import ServerDownPage from "./components/ServerDownPage";


function AppContent() {
  const { activeCall, endCall } = useVideoCall();

  return (
    <>
      <Routes>
        <Route path="/" element={<ExploreView />} />
        {/* Admin Routes với AdminLTE Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="security" element={<AdminSecurityPage />} />
        </Route>
        <Route path="/posts/:id" element={<PostView />} />
        <Route
          path="/posts/create"
          element={
            <PrivateRoute>
              <CreatePostView />
            </PrivateRoute>
          }
        />
        <Route
          path="/messenger"
          element={
            <PrivateRoute>
              <MessengerView />
            </PrivateRoute>
          }
        />
        <Route path="/search" element={<SearchView />} />
        <Route path="/users/:id" element={<ProfileView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/signup" element={<SignupView />} />
        <Route path="/verify" element={<OTPView />} />
        <Route path="/auth/callback" element={<GoogleCallbackView />} />
        {/* <Route path="/server-down" element={<ServerDownPage />} /> */}
      </Routes>

      {/* Incoming call modal */}
      <IncomingCallModal />

      {/* Active video call */}
      {console.log('AppContent: activeCall =', activeCall)}
      {activeCall && <VideoCall onCallEnd={endCall} />}
    </>
  );
}

function App() {

  const [user, setUser] = useState(isLoggedIn());
  const [serverDown, setServerDown] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    generateDeviceId();

    // Validate session khi app khởi động
    const checkSession = async () => {
      const storedUser = isLoggedIn();

      if (storedUser) {
        console.log('Validating stored session...');
        const validUser = await validateSession();

        if (validUser) {
          console.log('Session is valid');
          setUser(validUser);
        } else {
          console.log('Session expired, clearing user');
          setUser(null);
        }
      }

      setIsValidating(false);
    };

    checkSession();
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    initiateSocketConnection();
    setTimeout(() => {
      setIsRetrying(false);
    }, 2000);
  };

  // Show loading state khi đang validate session
  if (isValidating) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Đang kiểm tra phiên đăng nhập...</div>
        </div>
      </ThemeProvider>
    );
  }

  // Nếu server down và user đã login, hiển thị ServerDownPage
  if (serverDown && user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ServerDownPage onRetry={handleRetry} isRetrying={isRetrying} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <CssBaseline />
        <NotificationProvider>
          <VideoCallProvider>
            <AppContent />
          </VideoCallProvider>
        </NotificationProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
