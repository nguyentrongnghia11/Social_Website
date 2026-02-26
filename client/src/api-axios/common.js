import { instance } from "../config";
import axios from "axios";
import { disconnectSocket, initiateSocketConnection } from "../helpers/socketHelper";

instance.interceptors.request.use(
    config => {
        const deviceId = localStorage.getItem("deviceId");
        if (deviceId) {
            config.headers["x-device-id"] = deviceId;
        }
        return config;
    },
    error => Promise.reject(error)
);

instance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Handle server down (network error)
        if (
            error.code === 'ERR_NETWORK' &&
            error.message &&
            error.message.includes('ERR_CONNECTION_REFUSED')
        ) {
            // window.location.href = '/server-down';
            return; // Stop further processing
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const deviceId = localStorage.getItem("deviceId");
            if (!deviceId) {
                if (!window.location.pathname.includes('/login')) {
                    localStorage.clear();
                    window.location.replace('/login');
                }
                return Promise.reject(error);
            }
            try {
                const res = await axios.post(
                    `${instance.defaults.baseURL}auth/v1/refresh`,
                    {},
                    {
                        headers: {
                            "x-device-id": deviceId,
                            "Content-Type": "application/json"
                        },
                        withCredentials: true
                    }
                );
                if (res.status === 200) {
                    console.log('Token refreshed, reconnecting socket...');
                    disconnectSocket();
                    initiateSocketConnection();
                    return instance(originalRequest);
                }
            } catch (refreshError) {
                if (!window.location.pathname.includes('/login')) {
                    localStorage.clear();
                    window.location.replace('/login');
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export { instance };