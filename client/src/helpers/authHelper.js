import { disconnectSocket, initiateSocketConnection, socket } from "./socketHelper";
import { requestPermission } from "./messaging_getToken";
import { registerGroup, updateToken, logout as logoutAPI } from "../api-axios/user";

const isLoggedIn = () => {
  return JSON.parse(localStorage.getItem("user"));
};

const loginUser = async (user) => {
  console.log  ("checkeed")
  
  disconnectSocket();
  
  localStorage.setItem("user", JSON.stringify(user));
  
  initiateSocketConnection();

  const token = await requestPermission();
  console.log('token firebase ', token)

  if (!token)
    return


  if (token !== localStorage.getItem("tokenFcm")) {
    localStorage.setItem("tokenFcm", token);
  }

  const deviceId = user.deviceId || localStorage.getItem("deviceId");
  await updateToken(token, deviceId)

};

const logoutUser = async () => {
  // Call the logout API to clear server-side session
  await logoutAPI();
  
  // Disconnect socket and clear local storage
  disconnectSocket();
  localStorage.removeItem('user')
  localStorage.removeItem("tokenFcm")
};

export { loginUser, isLoggedIn, logoutUser };
