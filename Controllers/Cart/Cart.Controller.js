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
      const { tableId, bookingTime, services = [], listFood = [] } = req.body; // Khởi tạo listFood là mảng rỗng nếu không có
      const userId = req.user_id;

      // Thêm bàn vào giỏ hàng, xử lý listFood là mảng rỗng hoặc không
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
      console.error("Error adding table to cart:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error adding table to cart.",
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
        message: "Error removing table from cart.",
        error: error.message,
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

  async getCartByUserId(req, res) {
    try {
      const userId = req.user_id; // Giả sử user_id được lấy từ token đã xác thực

      const cart = await CART_SERVICE.getCartByUserId(userId);

      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error("Error fetching cart:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error fetching cart.",
        error: error.message,
      });
    }
  }

  async addFoodToTable(req, res) {
    try {
      const { tableId, listFood } = req.body;
      const userId = req.user_id;

      if (!listFood || listFood.length === 0) {
        return res.status(400).json({
          success: false,
          message: "List of food is required",
        });
      }

      const cart = await CART_SERVICE.addFoodToTable(userId, tableId, listFood);

      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error("Error adding food to table:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error adding food to table.",
        error: error.message,
      });
    }
  }

  async updateFoodInTable(req, res) {
    try {
      const { tableId, foodId, newQuantity } = req.body;
      const userId = req.user_id;

      if (!newQuantity || newQuantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than 0",
        });
      }

      const cart = await CART_SERVICE.updateFoodInTable(
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
      console.error("Error updating food in table:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error updating food in table.",
        error: error.message,
      });
    }
  }
  async addServiceToCart(req, res) {
    try {
      const { tableId, selectedServiceIds } = req.body; // Lấy selectedServiceIds từ request body
      const userId = req.user_id; // Lấy user_id từ token hoặc request

      if (!selectedServiceIds || selectedServiceIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No services selected.",
        });
      }

      // Gọi hàm service để thêm dịch vụ vào giỏ hàng
      const cart = await CART_SERVICE.addServiceToCart(
        userId,
        tableId,
        selectedServiceIds // Truyền danh sách ID dịch vụ vào
      );

      return res.status(200).json({
        success: true,
        data: cart, // Trả về thông tin giỏ hàng sau khi cập nhật
      });
    } catch (error) {
      console.error("Error adding services to cart:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error adding services to cart.",
        error: error.message,
      });
    }
  }
}

module.exports = new CART_CONTROLLER();
