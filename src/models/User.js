const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  pincode: String,
  locality: String,
  streetAddress: String,
  city: String,
  state: String,
  landmark: String,
  alternatePhone: String,
  addressType: { type: String, enum: ['Home', 'Work'], default: 'Home' },
});

const UserSchema = new mongoose.Schema({
  email: String,
  phone: String,
  name: String,
  gender: String,
  bio: String,
  addresses: [AddressSchema],
   livestreams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Livestream" }] ,
  profilePicture: { type: String, default: "" }, // Changed to an array of addresses
  inviteCode: String,
  role: { 
    type: String, 
    enum: ["influencer", "customer", "admin"], 
    default: "customer" 
  },
  cart: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      description: String,
      price: { type: Number, required: true },
      image: String,
      category: String,
      stage: String ,
      quntity: Number,
    },
  ],
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
