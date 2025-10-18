const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const fileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: any) => ({
    folder: "uploads",
    resource_type: "raw",
    public_id: `${Date.now()}-${file.originalname}`,
  }),
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: any) => ({
    folder: "images",
    resource_type: "images",
    public_id: `${Date.now()}-${file.originalname}`,
  }),
});

export const uploadFileCloud = multer({ storage: fileStorage });
export const uploadImageCloud = multer({ storage: imageStorage });
