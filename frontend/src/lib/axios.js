import axios from "axios";
import toast from "react-hot-toast";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
  withCredentials: true,
});

export function registerAxiosInterceptors() {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      let message =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred. Please try again.";
      if (error.response) {
        if (error.response.status === 401) {
          message = "Session expired or unauthorized. Please log in again.";
        } else if (error.response.status === 403) {
          message = "You do not have permission to perform this action.";
        } else if (error.response.status === 429) {
          message = "Too many requests. Please slow down.";
        } else if (error.response.status >= 500) {
          message = "Server error. Please try again later.";
        }
      } else if (error.code === "ECONNABORTED" || error.message === "Network Error") {
        message = "Network error. Please check your connection.";
      }
      toast.error(message);
      return Promise.reject(error);
    }
  );
}
