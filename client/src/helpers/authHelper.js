import { disconnectSocket, initiateSocketConnection, socket } from "./socketHelper";
import { requestPermission } from "./messaging_getToken";
import { registerGroup, updateToken, logout as logoutAPI, validateToken } from "../api-axios/user";

const isLoggedIn = () => {
  return JSON.parse(localStorage.getItem("user"));
};

// Validate token khi app khởi động hoặc sau thời gian dài không dùng
const validateSession = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    return null;
  }

  try {
    const result = await validateToken();

    if (result.valid) {
      return user;
    } else {
      console.log('Token expired or invalid, clearing session');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenFcm');
      disconnectSocket();
      return null;
    }
  } catch (error) {
    console.error('Session validation error:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('tokenFcm');
    disconnectSocket();
    return null;
  }
};

const loginUser = async (user) => {
  console.log("checkeed")
  disconnectSocket();
  localStorage.setItem("user", JSON.stringify(user));
  initiateSocketConnection();
  updateUserTokenAsync(user);
};

const updateUserTokenAsync = async (user) => {
  try {
    const token = await requestPermission();
    console.log('Token firebase ', token)

    if (!token)
      return

    if (token !== localStorage.getItem("tokenFcm")) {
      localStorage.setItem("tokenFcm", token);
    }

    const deviceId = user.deviceId || localStorage.getItem("deviceId");
    await updateToken(token, deviceId)
  } catch (error) {
    console.error('Error updating user token:', error);
  }
};

const logoutUser = async () => {
  await logoutAPI();
  disconnectSocket();
  localStorage.removeItem('user')
  localStorage.removeItem("tokenFcm")
};

export { loginUser, isLoggedIn, logoutUser, validateSession };
