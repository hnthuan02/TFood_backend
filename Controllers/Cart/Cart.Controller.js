const CART_SERVICE = require("../../Services/Cart/Cart.Service");

class CART_CONTROLLER {
  async createCart(req, res) {
    try {
      const userId = req.user_id;
      const cart = await CART_SERVICE.createCart(userId);
      return res.status(201).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error("Error creating cart:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error creating cart.",
        error: error.message,
      });
    }
  }

  async addTableToCart(req, res) {
    try {
      const { tableId, bookingTime, services, listFood } = req.body;
      const userId = req.user_id;

      // Kiểm tra nếu không có món ăn
      if (!listFood || listFood.length === 0) {
        return res.status(400).json({
          success: false,
          message: "List of food is required",
        });
      }

      // Lấy foodId và quantity từ phần tử đầu tiên của listFood
      const foodId = listFood[0]?.FOOD_ID;
      const quantity = listFood[0]?.QUANTITY;

      // Kiểm tra nếu foodId hoặc quantity không tồn tại
      if (!foodId || !quantity) {
        return res.status(400).json({
          success: false,
          message: "Food ID and quantity are required",
        });
      }

      // Thêm bàn vào giỏ hàng
      const cart = await CART_SERVICE.addTableToCart(
        userId,
        tableId,
        bookingTime,
        services,
        listFood
      );

      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error("Error adding room to cart:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error adding room to cart.",
        error: error.message,
      });
    }
  }

  async removeFoodFromTable(req, res) {
    try {
      const { tableId, foodId } = req.body;
      const userId = req.user_id;

      const cart = await CART_SERVICE.removeFoodFromTable(
        userId,
        tableId,
        foodId
      );
      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async removeTableFromCart(req, res) {
    try {
      const { tableId } = req.body;
      const userId = req.user_id;

      const cart = await CART_SERVICE.removeTableFromCart(userId, tableId);
      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateFoodQuantity(req, res) {
    try {
      const { tableId, foodId, newQuantity } = req.body;
      const userId = req.user_id;

      const cart = await CART_SERVICE.updateFoodQuantity(
        userId,
        tableId,
        foodId,
        newQuantity
      );
      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateTableInCart(req, res) {
    try {
      const { oldTableId, newTableId } = req.body;
      const userId = req.user_id;

      const cart = await CART_SERVICE.updateTableInCart(
        userId,
        oldTableId,
        newTableId
      );
      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateServiceInCart(req, res) {
    try {
      const { tableId, serviceName, newService } = req.body;
      const userId = req.user_id;

      const cart = await CART_SERVICE.updateServiceInCart(
        userId,
        tableId,
        serviceName,
        newService
      );
      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new CART_CONTROLLER();
