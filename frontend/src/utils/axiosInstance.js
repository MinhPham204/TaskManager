import axios from "axios";
import { BASE_URL, API_PATHS } from "./apiPaths"; 

const LOGIN_PATH = API_PATHS.AUTH.LOGIN || "/api/auth/login";
const SIGNUP_PATH = API_PATHS.AUTH.SIGNUP || "/api/auth/signup";
const SET_PASSWORD_PATH = API_PATHS.AUTH.SET_PASSWORD || "/api/auth/set-password";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        // TH1: Route công khai (Đăng nhập)
        if (config.url.includes(LOGIN_PATH)) {
            // Không làm gì, để request đi "sạch sẽ"
        } 
        else if (
            config.url.includes(SIGNUP_PATH) || 
            config.url.includes(SET_PASSWORD_PATH)
        ) {
            const verifiedToken = localStorage.getItem("verifiedToken");
            if (verifiedToken) {
                config.headers.Authorization = `Bearer ${verifiedToken}`;
            }
        } 
        else {
            const accessToken = localStorage.getItem("token");
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if(error.response) {
            if(error.response.status === 401){
                // localStorage.removeItem("token");
                // window.location.href = "/login";
            } else if (error.response.status === 500){
                console.error("Server error. Please try again later.");
            }
        } else if (error.code === "ECONNABORTED") {
            console.error("Request timeout. Please try again.");
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;