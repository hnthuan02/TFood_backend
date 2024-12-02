const CART_SERVICE = require("../../Services/Cart/Cart.Service");
const CART_MODEL = require("../../Models/Cart/Cart.Model");
const TABLE_MODEL = require("../../Models/Table/Table.Model");

class CART_CONTROLLER {
  async createCart(req, res) {
    try {
      const userId = req.user_id;
      console.log(userId);
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
      const { tableId, bookingTime } = req.body;
      const userId = req.user_id;

      const cart = await CART_SERVICE.removeTableFromCart(
        userId,
        tableId,
        bookingTime
      );
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
      await CART_SERVICE.checkAndRemoveInvalidTables(userId);
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
      const { tableId, selectedServiceIds } = req.body;
      const userId = req.user_id;

      // Gọi hàm service để cập nhật dịch vụ trong giỏ hàng
      const cart = await CART_SERVICE.updateServicesInCart(
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

  async updateServiceInCart(req, res) {
    try {
      const { tableId, selectedServices } = req.body; // Lấy thông tin từ body
      const userId = req.user_id;

      if (!selectedServices || selectedServices.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No services selected.",
        });
      }

      const cart = await CART_SERVICE.updateServiceInCart(
        userId,
        tableId,
        selectedServices
      );

      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error("Error updating services in cart:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error updating services in cart.",
        error: error.message,
      });
    }
  }

  async updateBookingTime(req, res) {
    try {
      const { tableId, newBookingTime } = req.body;
      const userId = req.user_id; // Lấy userId từ token
      if (!tableId || !newBookingTime) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const updatedCart = await CART_SERVICE.updateBookingTime(
        userId,
        tableId,
        newBookingTime
      );

      return res
        .status(200)
        .json({ message: "Booking time updated successfully", updatedCart });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async checkAndRemoveInvalidTables(userId) {
    try {
      const cart = await CART_MODEL.findOne({ USER_ID: userId });

      if (!cart) {
        throw new Error("Cart not found.");
      }

      // Lấy tất cả các bảng trong Cart
      const listTables = cart.LIST_TABLES;
      const updatedTables = [];

      for (const table of listTables) {
        const tableId = table.TABLE_ID;
        const bookingTime = table.BOOKING_TIME;

        // Lấy tất cả các BOOKING_TIME của bàn từ model Table
        const tableInfo = await TABLE_MODEL.findById(tableId);

        if (!tableInfo) {
          throw new Error(`Table with ID ${tableId} not found.`);
        }

        let isValid = true;

        for (const booking of tableInfo.BOOKING_TIMES) {
          const tableBookingTime = moment(booking.START_TIME);
          const userBookingTime = moment(bookingTime);

          // Kiểm tra trùng ngày và giờ hoặc chênh lệch trong khoảng 3 giờ
          const timeDifference = userBookingTime.diff(
            tableBookingTime,
            "hours"
          );

          if (
            userBookingTime.isSame(tableBookingTime, "day") &&
            Math.abs(timeDifference) <= 3
          ) {
            isValid = false;
            break;
          }
        }

        // Nếu không hợp lệ, loại bỏ bàn khỏi LIST_TABLES
        if (!isValid) {
          continue; // Không thêm vào danh sách bảng hợp lệ
        }

        updatedTables.push(table); // Bàn hợp lệ, giữ lại
      }

      // Cập nhật lại LIST_TABLES của giỏ hàng
      cart.LIST_TABLES = updatedTables;
      await cart.save();
    } catch (error) {
      console.error(
        "Error checking and removing invalid tables:",
        error.message
      );
      throw new Error("Error checking and removing invalid tables.");
    }
  }
}

module.exports = new CART_CONTROLLER();
