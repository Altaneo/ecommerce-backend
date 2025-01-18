const express = require('express');
const Cart = require('../models/cartModel');
const router = express.Router();

// Add to cart
router.post('/add', async (req, res) => {
  try {
    const { productId, name, description, price, image, category, rating,stage,quantity } = req.body;
    const cartItem = new Cart({ productId, name, description, price, image, category, rating,stage, quantity });
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
  router.get('/:productId', async (req, res) => {
    const { productId } = req.params;
  
    try {
      const cartItem = await Cart.findOne({ productId });
  
      if (!cartItem) {
        return res.status(404).json({ message: 'Item not found in the cart.' });
      }
  
      res.status(200).json(cartItem);
    } catch (error) {
      console.error('Error fetching cart item:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });
  router.put('/update/:productId', async (req, res) => {
    const { productId } = req.params;
    const updateFields = req.body; // Get all fields from the request body
  
    try {
      // Find the cart item and update it with the fields provided in the payload
      const updatedItem = await Cart.findOneAndUpdate(
        { productId },
        { $set: updateFields }, // Use the dynamic payload to update
        { new: true }
      );
  
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found in the cart.' });
      }
  
      res.status(200).json({ message: 'Cart item updated successfully.', item: updatedItem });
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });
  router.put('/update', async (req, res) => {
    const productsToUpdate = req.body; // This will be an array of product objects
  
    try {
      const updatePromises = productsToUpdate.map(product => {
        return Cart.findByIdAndUpdate(
          product._id,
          { $set: { stage: product.stage } },
          { new: true }
        );
      });
  
      // Wait for all updates to complete
      const updatedProducts = await Promise.all(updatePromises);
  
      res.status(200).json({ message: 'All product stages updated to PaymentCompleted successfully.', updatedProducts });
    } catch (error) {
      console.error('Error updating product stages:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });  
module.exports = router;
