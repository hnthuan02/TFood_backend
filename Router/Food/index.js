const express = require("express");
const router = express.Router();
const FOOD_CONTROLLER = require("../../Controllers/Food/Food.Controller");
const {
  verifyToken,
  verifyTokenAdmin,
} = require("../../Middleware/verifyToken");
const authorizeRoles = require("../../Middleware/authorizeRoles");
const upload = require("../../Config/multerConfig");

router.post(
  "/createFood",
  verifyToken,
  authorizeRoles("ADMIN"),
  upload,
  FOOD_CONTROLLER.createFood
);
router.delete(
  "/deleteFood/:foodId",
  verifyToken,
  authorizeRoles("ADMIN"),
  FOOD_CONTROLLER.deleteFood
);
router.get("/allFood", FOOD_CONTROLLER.getAllFoods);
router.get("/oneFood", FOOD_CONTROLLER.getFoodsByCriteria);
router.put(
  "/updateFood/:foodId",
  verifyToken,
  authorizeRoles("ADMIN"),
  upload,
  FOOD_CONTROLLER.updateFood
);
router.post("/search", FOOD_CONTROLLER.searchFood);

module.exports = router;
