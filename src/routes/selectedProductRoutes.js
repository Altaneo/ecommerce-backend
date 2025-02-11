const express = require("express");
const { saveSelectedProduct, getSelectedProducts,deleteSelectedProduct } = require("../controllers/selectedProductController");

const router = express.Router();
router.post("/", saveSelectedProduct);
router.get("/", getSelectedProducts);
router.delete("/:id", deleteSelectedProduct);

module.exports = router;
