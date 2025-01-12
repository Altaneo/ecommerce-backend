const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: String,
  phone: String,
  name: String,
  gender: String,
  address: String,
  inviteCode: String,
  cart: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      description: String,
      price: { type: Number, required: true },
      image: String,
      category: String,
    },
  ],
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
