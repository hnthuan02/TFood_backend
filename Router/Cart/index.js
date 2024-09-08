const express = require("express");
const router = express.Router();
const CART_CONTROLLER = require("../../Controllers/Cart/Cart.Controller");
const {
  verifyToken,
  verifyTokenAdmin,
} = require("../../Middleware/verifyToken");

router.post("/createCart", verifyToken, CART_CONTROLLER.createCart);
router.get("/getCart", CART_CONTROLLER.getCart);
router.get("/getCartById", verifyToken, CART_CONTROLLER.getCartByUserId);
router.put("/updateCart/:cartId", CART_CONTROLLER.updateCart);
router.put("/updateCart/:cartId/addFood", CART_CONTROLLER.addFoodToCart);
router.put(
  "/updateCart/:cartId/deleteFood/:foodId",
  CART_CONTROLLER.removeFoodFromCart
);

module.exports = router;
