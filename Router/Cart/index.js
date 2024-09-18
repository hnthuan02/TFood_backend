const express = require("express");
const router = express.Router();
const CART_CONTROLLER = require("../../Controllers/Cart/Cart.Controller");
const {
  verifyToken,
  verifyTokenAdmin,
} = require("../../Middleware/verifyToken");

router.post("/createCart", verifyToken, CART_CONTROLLER.addTableToCart);
router.get("/getCartById", verifyToken, CART_CONTROLLER.getCartByUserId);

module.exports = router;
