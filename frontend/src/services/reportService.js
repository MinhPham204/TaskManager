import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const downloadReport = async (reportType, fileName) => {
    try {
        const url = reportType === 'tasks' 
            ? API_PATHS.REPORTS.EXPORT_TASKS 
            : API_PATHS.REPORTS.EXPORT_USERS; 

        // 1. Gọi API, yêu cầu kiểu dữ liệu là blob
        const response = await axiosInstance.get(url, {
            responseType: 'blob', 
        });

        // 2. Tạo một URL tạm thời từ file blob
        const fileBlob = new Blob([response.data], { type: response.headers['content-type'] });
        const fileUrl = URL.createObjectURL(fileBlob);

        // 3. Tạo một thẻ <a> ẩn để kích hoạt download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', fileName); 
        document.body.appendChild(link);
        
        // 4. Kích hoạt và dọn dẹp
        link.click();
        link.parentNode.removeChild(link);
        URL.revokeObjectURL(fileUrl); 

    } catch (error) {
        console.error("Error downloading report:", error);
        // Ném lỗi ra ngoài để component có thể bắt
        throw new Error(error.response?.data?.message || "Could not download report");
    }
};