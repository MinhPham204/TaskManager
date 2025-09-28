import axios from "axios";
import {BASE_URL} from "./apiPaths";

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
        if(config.url.includes("/auth/set-password")){
            const verifiedToken = localStorage.getItem("verifiedToken");
            if(verifiedToken) {
                config.headers.Authorization = `Bearer ${verifiedToken}`;
            }
        } else {
            const accessToken = localStorage.getItem("token");
            if(accessToken){
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }
        console.log("Axios Request:", config);

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        console.log("Axios Response:", response);

        return response;
    },
    (error) => {
        if(error.response) {
            if(error.response.status === 401){
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

