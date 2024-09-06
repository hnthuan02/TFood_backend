const express = require("express");
const router = express.Router();
const FOOD_CONTROLLER = require("../../Controllers/Food/Food.Controller");

router.post("/createFood", FOOD_CONTROLLER.createFood);
router.delete("/deleteFood/:foodId", FOOD_CONTROLLER.deleteFood);
router.get("/allFood", FOOD_CONTROLLER.getAllFoods);
router.get("/oneFood", FOOD_CONTROLLER.getFoodsByCriteria);
router.put("/updateFood/:foodId", FOOD_CONTROLLER.updateFood);

module.exports = router;
