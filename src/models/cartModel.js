const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  productId: { type: String, required: true }, // Unique product identifier
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String },
  rating: { type: Number },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
