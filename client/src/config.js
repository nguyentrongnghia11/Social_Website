// let BASE_URL = "https://post-it-heroku.herokuapp.com/";
// if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
//   BASE_URL = "http://localhost:4000/";
// }

import axios from "axios";
import { v4 as uuidv4 } from "uuid";

let BASE_URL = "https://socialmediaappserver-e2ws.onrender.com/";

// Auto detect API URL based on hostname
const getApiUrl = () => {
    return `http://18.136.198.73`;
    // return `http://localhost:3000`;

};

const URL = getApiUrl();

const instance = axios.create({
    baseURL: `${URL}/api/`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

// Add request interceptor to include device ID in headers
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


export { BASE_URL, instance, URL };

// Add response interceptor to handle server down (ERR_CONNECTION_REFUSED)

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

