import axios from "axios";

const isProduction = import.meta.env.VITE_API_ENV === "production";
let BASE_URL = isProduction ? import.meta.env.VITE_API_URL  : "http://localhost";

const instance = axios.create({
    baseURL: `${BASE_URL}/api/`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})


export { BASE_URL, instance };

