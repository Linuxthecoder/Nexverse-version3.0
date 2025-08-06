import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_CONFIG } from "./config.js";

cloudinary.config({
  cloud_name: CLOUDINARY_CONFIG.cloud_name,
  api_key: CLOUDINARY_CONFIG.api_key,
  api_secret: CLOUDINARY_CONFIG.api_secret,
});

export default cloudinary;
