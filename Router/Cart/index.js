const express = require("express");
const router = express.Router();
const CART_CONTROLLER = require("../../Controllers/Cart/Cart.Controller");
const {
  verifyToken,
  verifyTokenAdmin,
} = require("../../Middleware/verifyToken");

router.post("/createCart", verifyToken, CART_CONTROLLER.addTableToCart);
router.get("/getCartById", verifyToken, CART_CONTROLLER.getCartByUserId);
router.post("/addFoodToTable", verifyToken, CART_CONTROLLER.addFoodToTable);
router.put(
  "/updateFoodInTable",
  verifyToken,
  CART_CONTROLLER.updateFoodInTable
);
router.post(
  "/removeFoodFromTable",
  verifyToken,
  CART_CONTROLLER.removeFoodFromTable
);
router.post(
  "/removeTableFromCart",
  verifyToken,
  CART_CONTROLLER.removeTableFromCart
);
router.post("/addServiceToCart", verifyToken, CART_CONTROLLER.addServiceToCart);

module.exports = router;
