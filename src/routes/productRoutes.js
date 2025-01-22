const express = require('express');
const Product = require('../models/Product');
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

module.exports = router;
