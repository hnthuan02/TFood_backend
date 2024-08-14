const RESTAURANT_MODEL = require("../../Models/Restaurant/Restaurant.Model");
const RESTAURANT_SERVICE = require("../../Services/Restaurant/Restaurant.Service");

class RESTAURANT_CONTROLLER {
  createRestaurant = async (req, res) => {
    try {
      const restaurant = await RESTAURANT_SERVICE.createRestaurant(req.body);
      res.status(201).send(restaurant);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  };

  updateRestaurant = async (req, res) => {
    const { id } = req.params;
    const restaurantData = req.body;
    try {
      const restaurant = await RESTAURANT_SERVICE.updateRestaurantById(
        id,
        restaurantData
      );
      res.status(201).send(restaurant);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  };
}

module.exports = new RESTAURANT_CONTROLLER();
