const express = require('express');
const Cart = require('../models/cartModel');
const router = express.Router();

// Add to cart
router.post('/add', async (req, res) => {
  try {
    const { productId, name, description, price, image, category, rating } = req.body;
    const cartItem = new Cart({ productId, name, description, price, image, category, rating });
    await cartItem.save();
    res.status(201).json({ message: 'Product added to cart successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add product to cart', error });
  }
});

// Get cart items (optional)
router.get('/', async (req, res) => {
  try {
    const cartItems = await Cart.find();
    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cart items', error });
  }
});
router.delete('/:productId', async (req, res) => {
    
    try {
      const { productId } = req.params;
      await Cart.deleteOne({ productId });
      res.status(200).json({ message: 'Product removed from cart successfully!' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove product', error });
    }
  });
module.exports = router;
