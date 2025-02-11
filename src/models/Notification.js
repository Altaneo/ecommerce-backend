// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["promo", "alert", "update"],
      default: "promo",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
  });
  
const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
