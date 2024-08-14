const RESTAURANT_MODEL = require("../../Models/Restaurant/Restaurant.Model");

class RESTAURANT_SERVICE {
  async createRestaurant(data) {
    const newRestaurant = new RESTAURANT_MODEL(data);
    const result = await newRestaurant.save();
    return result.toObject();
  }

  async updateRestaurantById(id, restaurantData) {
    const updateRestaurant = await RESTAURANT_MODEL.findByIdAndUpdate(
      id,
      {
        ...restaurantData,
      },
      { new: true }
    );
    return updateRestaurant;
  }
}

module.exports = new RESTAURANT_SERVICE();
