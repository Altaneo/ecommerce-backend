const mongoose = require("mongoose");

const selectedProductSchema = new mongoose.Schema({
  id: { type: String },
  name: {
    en: { type: String, required: true },
    hi: { type: String, required: true },
    ta: { type: String, required: true },
    gu: { type: String, required: true },
  },
  description: {
    en: { type: String, required: true },
    hi: { type: String, required: true },
    ta: { type: String, required: true },
    gu: { type: String, required: true },
  },
  price: { type: Number },
  type: { type: String },
  brand: { type: String },
  image: { type: String },
  category: { type: String },
  stock: { type: String },
  rating: { type: Number, default: 0 },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: { type: String },
      email: { type: String },
      review: { type: String },
      rating: { type: Number, min: 1, max: 5 },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const SelectedProduct = mongoose.model("SelectedProduct", selectedProductSchema);

module.exports = SelectedProduct;
