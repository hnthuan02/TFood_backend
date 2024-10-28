const BookingService = require("../../Services/Booking/Booking.Service");
const Cart = require("../../Models/Cart/Cart.Model");
const Booking = require("../../Models//Booking/Booking.Model");

class BookingController {
  // Tạo booking từ giỏ hàng
  async createBookingFromCart(req, res) {
    try {
      const userId = req.user_id; // Lấy userId từ token
      const { userName, phoneNumber, email, selectedTables } = req.body; // selectedTables là mảng chứa ID của các bàn được chọn

      // Kiểm tra xem các thông tin người dùng đã được cung cấp chưa
      if (
        !userName ||
        !phoneNumber ||
        !email ||
        !selectedTables ||
        !selectedTables.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin người dùng hoặc bàn được chọn",
        });
      }

      // Tìm giỏ hàng của người dùng
      const cart = await Cart.findOne({ USER_ID: userId })
        .populate({
          path: "LIST_TABLES.SERVICES.SERVICES_ID",
          select: "servicePrice", // Lấy giá dịch vụ
        })
        .populate({
          path: "LIST_TABLES.LIST_FOOD.FOOD_ID",
          select: "PRICE", // Lấy giá món ăn
        });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart is empty.",
        });
      }

      // Lọc danh sách các bàn được chọn từ giỏ hàng
      const selectedTablesData = cart.LIST_TABLES.filter((table) =>
        selectedTables.includes(table.TABLE_ID.toString())
      );

      if (!selectedTablesData.length) {
        return res.status(400).json({
          success: false,
          message: "Không có bàn nào được chọn.",
        });
      }

      // Tính tổng giá cho các bàn được chọn
      const totalPrice = selectedTablesData.reduce((total, table) => {
        const totalFoodPrice = table.LIST_FOOD.reduce((foodTotal, food) => {
          const foodPrice = food.FOOD_ID ? food.FOOD_ID.PRICE : 0;
          return foodTotal + (foodPrice * food.QUANTITY || 0);
        }, 0);

        const totalServicePrice = table.SERVICES.reduce(
          (serviceTotal, service) => {
            if (service.SERVICES_ID) {
              return serviceTotal + service.SERVICES_ID.servicePrice;
            }
            return serviceTotal;
          },
          0
        );

        return (
          total + totalFoodPrice + totalServicePrice + (table.TABLE_PRICE || 0)
        );
      }, 0);

      // Tạo booking mới từ các bàn được chọn
      const newBooking = new Booking({
        USER_ID: userId,
        USER_NAME: userName,
        PHONE_NUMBER: phoneNumber,
        EMAIL: email,
        LIST_TABLES: selectedTablesData.map((table) => ({
          TABLE_ID: table.TABLE_ID,
          BOOKING_TIME: table.BOOKING_TIME,
          SERVICES: table.SERVICES.map((service) => ({
            SERVICES_ID: service.SERVICES_ID ? service.SERVICES_ID._id : null,
          })),
          LIST_FOOD: table.LIST_FOOD.map((food) => ({
            FOOD_ID: food.FOOD_ID._id,
            QUANTITY: food.QUANTITY,
          })),
        })),
        TOTAL_PRICE: totalPrice,
        STATUS: "NotYetPaid",
        BOOKING_TYPE: "Website",
      });

      await newBooking.save();

      // Kiểm tra xem có chọn hết các bàn trong giỏ hàng hay không
      if (selectedTables.length === cart.LIST_TABLES.length) {
        // Nếu tất cả các bàn được chọn, xóa toàn bộ giỏ hàng
        await Cart.findOneAndDelete({ USER_ID: userId });
      } else {
        // Nếu không, chỉ xóa các bàn được chọn
        const remainingTables = cart.LIST_TABLES.filter(
          (table) => !selectedTables.includes(table.TABLE_ID.toString())
        );
        cart.LIST_TABLES = remainingTables;
        await cart.save();
      }

      return res.status(201).json({
        success: true,
        data: newBooking,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Error creating booking from cart: ${error.message}`,
      });
    }
  }

  // Lấy danh sách booking theo userId
  async getBookingsByUserId(req, res) {
    try {
      const userId = req.user_id; // Lấy userId từ token

      const bookings = await BookingService.getBookingsByUserId(userId);

      return res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Cập nhật trạng thái booking
  async updateBookingStatus(req, res) {
    try {
      const { bookingId, status } = req.body;

      const updatedBooking = await BookingService.updateBookingStatus(
        bookingId,
        status
      );

      return res.status(200).json({
        success: true,
        data: updatedBooking,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Cập nhật trạng thái thanh toán
  async updatePaymentStatus(req, res) {
    try {
      const { bookingId, paymentStatus } = req.body;

      const updatedBooking = await BookingService.updatePaymentStatus(
        bookingId,
        paymentStatus
      );

      return res.status(200).json({
        success: true,
        data: updatedBooking,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateBookingStatusAdmin(req, res) {
    try {
      const { bookingId } = req.body; // Lấy bookingId từ body của request

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "bookingId is required",
        });
      }

      // Gọi service để cập nhật trạng thái
      const updatedBooking = await BookingService.updateBookingAndTableStatus(
        bookingId
      );

      res.status(200).json({
        success: true,
        message: "Booking and Table statuses updated to Completed",
        data: updatedBooking,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTotalPrice(req, res) {
    try {
      // Sử dụng MongoDB Aggregation để tính tổng TOTAL_PRICE của tất cả bookings
      const totalPriceData = await Booking.aggregate([
        {
          $group: {
            _id: null, // Không cần nhóm theo trường nào
            totalPrice: { $sum: "$TOTAL_PRICE" }, // Tính tổng TOTAL_PRICE
          },
        },
      ]);

      // Nếu không có dữ liệu trả về (tức là không có booking nào)
      if (totalPriceData.length === 0) {
        return res.status(200).json({
          success: true,
          totalPrice: 0,
        });
      }

      // Trả về kết quả
      return res.status(200).json({
        success: true,
        totalPrice: totalPriceData[0].totalPrice,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi tính tổng giá trị booking",
        error: error.message,
      });
    }
  }

  async getAllBookings(req, res) {
    try {
      const bookings = await BookingService.getAllBookings();
      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error retrieving bookings",
        error: error.message,
      });
    }
  }

  async getTablesInBookingWithTime(req, res) {
    const { id } = req.params; // Lấy bookingId từ params

    const tables = await BookingService.getTablesInBookingWithTime(id);

    if (!tables) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Trả về thông tin tables với thời gian booking
    return res.status(200).json({ success: true, data: tables });
  }
  async getTotalFoodQuantity(req, res) {
    try {
      const totalFoodQuantity = await BookingService.getTotalFoodQuantity();

      return res.status(200).json({
        success: true,
        data: totalFoodQuantity,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error calculating total food quantity",
        error: error.message,
      });
    }
  }
}

module.exports = new BookingController();
