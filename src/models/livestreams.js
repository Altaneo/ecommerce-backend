const mongoose = require("mongoose");

const livestreamSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: {
      en: { type: String, required: true },
      hi: { type: String, required: true },
      ta: { type: String, required: true },
      gu: { type: String, required: true },
    },
    description: {
      en: { type: String, default: "" },
      hi: { type: String, default: "" },
      ta: { type: String, default: "" },
      gu: { type: String, default: "" },
    },
    liveChatId: { type: String },
    status: { type: String },
    isLive: { type: Boolean, default: false },
    streamId: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    products: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // ✅ Auto-generate _id for each product
        name: {
          en: { type: String, required: true },
          hi: { type: String, required: true },
          ta: { type: String, required: true },
          gu: { type: String, required: true },
        },
        description: {
          en: { type: String },
          hi: { type: String },
          ta: { type: String },
          gu: { type: String },
        },
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
