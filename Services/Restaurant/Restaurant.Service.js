const RESTAURANT_MODEL = require("../../Models/Restaurant/Restaurant.Model");

class RESTAURANT_SERVICE {
  async createRestaurant(data) {
    const newRestaurant = new RESTAURANT_MODEL({
      NAME: "TFOOD" + data.ADDRESS.Pr,
      ADDRESS: data.ADDRESS,
      STATE: "Close",
      PHONE: data.PHONE,
      EMAIL: "thuanhuynhthuan2002@gmail.com",
    });
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
