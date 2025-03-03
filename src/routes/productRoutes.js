const express = require('express');
const Product = require('../models/Product');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const userService = require('../services/userService');
const { checkAuthMiddleware } = require('../controllers/authController');
const router = express.Router();

// Get all products
router.get('/products/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId).populate('reviews.user', 'name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const averageRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    res.json({ ...product._doc, averageRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
router.post('/products/:productId/reviews',checkAuthMiddleware, async (req, res) => {
  try {
    const productId = req.params.productId;

    const { review, rating } = req.body;
    const {userId } = req.user;
 
    if (!review || !rating ) {
      return res.status(400).json({ message: 'Review, rating, and userId are required' });
    }
  const user = await userService.findUser(userId);
     if (!user) {
       return res.status(404).json({ message: 'User not found' });
     }  
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
  

    const newReview = {
      user: user._id,
      userName: user.name,
      email: userId,
      review,
      rating,
    };

    product.reviews.push(newReview);
    product.rating =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added successfully', averageRating: product.rating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists in your project
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage });
router.post("/add", upload.array("images", 5), async (req, res) => {
  try {
    let products = req.body.products;

    if (!products) {
      return res.status(400).json({ message: "No products provided." });
    }

    products = JSON.parse(products); // Convert stringified JSON

    // Handle image uploads
    const uploadedImages = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    // Format products correctly
    const formattedProducts = products.map((product, index) => ({
      name: product.name, // Keep as an object (for multiple languages)
      description: product.description, // Keep as an object (for multiple languages)
      price: Number(product.price),
      stock: product.stock ? Number(product.stock) : 0, // Convert stock to number, default to 0 if empty
      type: product.type,
      brand: product.brand,
      image: uploadedImages[index] || product.image || "", // Use uploaded image if available
      category: product.category,
      rating: product.rating || 0,
    }));

    // Save to DB
    const savedProducts = await Product.insertMany(formattedProducts);

    res.status(201).json({ message: "Products added successfully", products: savedProducts });
  } catch (error) {
    console.error("Error adding products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const imagePath = path.join(__dirname, "../..", "uploads", path.basename(product.image));
    await Product.findByIdAndDelete(req.params.id);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/products/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Error updating product" });
  }
});
module.exports = router;
