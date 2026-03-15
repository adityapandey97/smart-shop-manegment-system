// ============================================
//   Cloudinary Configuration
//   Used for uploading product images to cloud
// ============================================

const cloudinary = require("cloudinary").v2;

// Set up Cloudinary with our credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
