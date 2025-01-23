const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom ID (like '10')
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, required: true },
  brand: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: { type: String},
      email: { type: String},
      review: { type: String },
      rating: { type: Number, min: 1, max: 5 },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
