const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  review: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  date: { type: Date, default: Date.now },
});
const cartSchema = new mongoose.Schema({
  productId: { type: String, required: true }, // Unique product identifier
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String },
  rating: { type: Number },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stage: { 
    type: String, 
    enum: [
      'None',
      'AddedToCart',    
      'PendingPayment',   
      'PaymentCompleted',
      'OrderConfirmed',
      'Shipped',
      'OutForDelivery',
      'Delivered',
      'Cancelled', 
      'Returned',
    ],
    default: 'None' 
  },
  quantity: { type: Number, default: 1 },
  reviews: [reviewSchema],
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
