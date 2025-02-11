const multer = require("multer");

const storage = multer.memoryStorage(); // Or use diskStorage if you prefer saving locally

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Increase to 5MB (adjust as needed)
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

module.exports = upload;
