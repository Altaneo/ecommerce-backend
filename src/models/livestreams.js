const mongoose = require("mongoose");

const livestreamSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    liveChatId: { type: String },
    status: { type: String },
    isLive: { type: Boolean, default: false },
    streamId: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    products: [
      {
        _id: { type: String, required: true }, // Ensure same type as Product model
        name: { type: String, required: true },
        description: { type: String },
        price: { type: String },
        type: { type: String },
        brand: { type: String },
        image: { type: String },
        category: { type: String },
        stock: { type: String },
      },
    ],

    startTime: { type: Date },
    endTime: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Livestream", livestreamSchema);
