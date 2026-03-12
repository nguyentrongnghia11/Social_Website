import { io } from "socket.io-client";
import { isLoggedIn } from "./authHelper";
import { BASE_URL } from "../config";

export let socket = null;
let serverDownCallback = null;
let reconnectAttempts = 0;
const MAX_ATTEMPTS_BEFORE_DOWN = 5;

const connectionCallbacks = new Set();

console.log ("Base url in socketHelper:", BASE_URL);

export const onSocketConnectionChange = (callback) => {
  connectionCallbacks.add(callback);
  return () => connectionCallbacks.delete(callback);
};

const notifyConnectionChange = (connected) => {
  connectionCallbacks.forEach(callback => callback(connected));
};

export const initiateSocketConnection = () => {
  const userAuth = isLoggedIn();
  const user = userAuth?.user || userAuth;

  if (!user) {
    console.log('No user, skipping socket');
    return null;
  }

  if (socket?.connected) {
    console.log('✅ Socket already connected');
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  const deviceId = localStorage.getItem('deviceId');

  socket = io(BASE_URL, {
    withCredentials: true,
    extraHeaders: { 'x-device-id': deviceId },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    reconnectAttempts = 0;
    notifyConnectionChange(true);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('⚠️ Socket disconnected:', reason);
    notifyConnectionChange(false);
  });

  socket.on('disconnect', (reason) => {
    console.log('⚠️ Socket disconnected:', reason);
  });

  socket.on('reconnect_attempt', (attempt) => {
    reconnectAttempts = attempt;
    console.log('Reconnect attempt:', attempt);

    if (attempt >= MAX_ATTEMPTS_BEFORE_DOWN && serverDownCallback) {
      console.log('Server appears to be down');
      serverDownCallback();
    }
  });

  return socket;
};

export const onEvent = (event, callback) => {
  if (!socket) {
    console.warn('Socket not initialized for event:', event, '- Call initiateSocketConnection() first');
    return false;
  }
  socket.on(event, callback);
  // console.log('Registered event:', event);
  return true;
};

export const emitEvent = (event, data) => {
  if (!socket?.connected) {
    console.warn('Cannot emit - socket not connected');
    return false;
  }
  socket.emit(event, data);
  return true;
};

// Remove event listener
export const offEvent = (event, callback) => {
  if (!socket) return;
  socket.off(event, callback);
};

// Disconnect
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  reconnectAttempts = 0;
  serverDownCallback = null;
};

export const isSocketConnected = () => {
  return socket?.connected || false;
};

export const onServerDown = (callback) => {
  serverDownCallback = callback;
};

export const getSocket = () => socket;
