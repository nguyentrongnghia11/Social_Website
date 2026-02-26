import axios from "axios";
import { v4 as uuidv4 } from "uuid";




const isProduction = import.meta.env.VITE_API_ENV === "production";

let BASE_URL = isProduction ? import.meta.env.VITE_API_URL  : "http://localhost:3000";

const instance = axios.create({
    baseURL: `${BASE_URL}/api/`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

instance.interceptors.request.use(
    (config) => {
        let deviceId = localStorage.getItem("deviceId");
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem("deviceId", deviceId);
        }
        config.headers['x-device-id'] = deviceId;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


export { BASE_URL, instance };

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.code === 'ERR_NETWORK' &&
            error.message
        ) {

            console.log('=== DEBUG UserMessengerEntry ===', error.code)
            // Redirect to server down page
            // window.location.href = '/server-down';
        }


        console.log('=== DEBUG UserMessengerEntry ===2222', error.code)
        return Promise.reject(error);
    }
);

