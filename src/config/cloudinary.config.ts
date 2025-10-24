const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const mixedStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: any) => {
    const isImage = file.mimetype.startsWith("image/");
    const folder = isImage ? "images" : "uploads";
    const resource_type = isImage ? "image" : "raw";

    return {
      folder,
      resource_type,
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

export const uploadMixedCloud = multer({ storage: mixedStorage });
