const SelectedProduct = require("../models/selectedProduct");

// Save a selected product
const saveSelectedProduct = async (req, res) => {
  const {
    id,
    name,
    description,
    price,
    type,
    brand,
    image,
    category,
    stock,
    rating,
    reviews,
  } = req.body;

  try {
    // Create a new SelectedProduct document with all the details
    const selectedProduct = new SelectedProduct({
      id,
      name,
      description,
      price,
      type,
      brand,
      image,
      category,
      stock,
      rating,
      reviews,
    });

    // Save the document to the database
    await selectedProduct.save();
    res.status(201).send("Product saved successfully!");
  } catch (error) {
    res.status(500).send("Failed to save product: " + error.message);
  }
};


// Get all selected products
const getSelectedProducts = async (req, res) => {
  try {
    const selectedProducts = await SelectedProduct.find();
    res.status(200).json(selectedProducts);
  } catch (error) {
    res.status(500).send("Failed to fetch selected products: " + error.message);
  }
};
const deleteSelectedProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await SelectedProduct.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).send("Product not found!");
    }

    res.status(200).send("Product deleted successfully!");
  } catch (error) {
    res.status(500).send("Failed to delete product: " + error.message);
  }
};

module.exports = {
  saveSelectedProduct,
  deleteSelectedProduct,
  getSelectedProducts,
};
