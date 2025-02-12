const express = require("express");
const mongoose = require("mongoose");
const Livestream = require("../models/livestreams");
const { checkAuthMiddleware } = require("../controllers/authController");
const User = require("../models/User");
const Product = require("../models/Product");
const router = express.Router();

// Create a new livestream
router.post("/add", checkAuthMiddleware, async (req, res) => {
  try {
    const { products, ...livestreamData } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "No products provided." });
    }

    const user = await User.findOne({
      $or: [{ email: req.user.userId }, { phone: req.user.userId }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const savedProducts = await Promise.all(
      products.map(async (p) => {
        if (!p._id) {
          return res.status(400).json({ message: "Product _id is required." });
        }

        let existingProduct = await Product.findById(p._id);
        if (!existingProduct) {
          // Save a new product if it doesn't exist
          existingProduct = new Product(p);
          await existingProduct.save();
        }

        return existingProduct; // Return the existing or newly created product
      })
    );

    const newLivestream = new Livestream({
      ...livestreamData,
      products: savedProducts.map((p) => ({
        _id: p._id, // Ensures same _id is used in Livestream schema
        name: p.name,
        description: p.description,
        price: p.price,
        type: p.type,
        brand: p.brand,
        image: p.image,
        category: p.category,
        stock: p.stock,
      })),
      host: user._id,
    });

    const savedLivestream = await newLivestream.save();
    user.livestreams.push(savedLivestream._id);
    await user.save();

    res.status(201).json(savedLivestream);
  } catch (error) {
    console.error("Error creating livestream:", error);
    res.status(500).json({ message: error.message });
  }
});
router.get("/:streamId", async (req, res) => {
  try {
    const livestream = await Livestream.findOne({ streamId: req.params.streamId });
    if (!livestream) return res.status(404).json({ message: "Livestream not found" });

    res.json(livestream);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get all livestreams (including host details)
router.get("/", async (req, res) => {
  try {
    const liveStreams = await Livestream.find().lean();
    console.log(liveStreams,"---------liveStreams")
    if (!liveStreams || liveStreams.length === 0) {
      return res.status(404).json({ message: "No live streams found" });
    }
    res.status(200).json(liveStreams);
  } catch (error) {
    console.error("Error fetching live streams:", error);
    res.status(500).json({ message: "Error fetching live streams", error });
  }
});
router.put("/update/:streamId", checkAuthMiddleware, async (req, res) => {
  try {
      const { streamId } = req.params;
      const updateData = req.body; // Get updated fields from request body

      if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ message: "No fields provided for update" });
      }

      // Find and update the livestream with dynamic fields
      const updatedLivestream = await Livestream.findOneAndUpdate(
          { streamId },
          { $set: updateData },
          { new: true }
      );

      if (!updatedLivestream) {
          return res.status(404).json({ message: "Livestream not found" });
      }

      res.status(200).json({ message: "Livestream updated successfully", updatedLivestream });
  } catch (error) {
      console.error("Error updating livestream:", error);
      res.status(500).json({ message: "Error updating livestream", error });
  }
});
module.exports = router;
