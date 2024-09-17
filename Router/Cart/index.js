const express = require("express");
const router = express.Router();
const CART_CONTROLLER = require("../../Controllers/Cart/Cart.Controller");
const {
  verifyToken,
  verifyTokenAdmin,
} = require("../../Middleware/verifyToken");

router.post("/createCart", verifyToken, CART_CONTROLLER.addTableToCart);

module.exports = router;
