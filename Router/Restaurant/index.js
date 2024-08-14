const express = require("express");
const router = express.Router();
const restaurantController = require("../../Controllers/Restaurant/Restaurant.Controller");

router.post("/createRestaurant", restaurantController.createRestaurant);
router.put("/updateRestaurant/:id", restaurantController.updateRestaurant);

module.exports = router;
