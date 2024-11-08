const BookingService = require("../../Services/Booking/Booking.Service");
const Cart = require("../../Models/Cart/Cart.Model");
const Booking = require("../../Models//Booking/Booking.Model");
const Voucher = require("../../Models/Voucher/Voucher.Model");
const VoucherController = require("../Voucher/Voucher.Controller");

class BookingController {
  // Tạo booking từ giỏ hàng
  async createBookingFromCart(req, res) {
    try {
      const userId = req.user_id; // Lấy userId từ token
      const { userName, phoneNumber, email, selectedTables, voucherCode } =
        req.body; // selectedTables là mảng chứa ID của các bàn được chọn
      // Kiểm tra thông tin người dùng
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
          select: "servicePrice",
        })
        .populate({
          path: "LIST_TABLES.LIST_FOOD.FOOD_ID",
          select: "PRICE",
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

      // Kiểm tra voucher nếu có
      let discountPercent = 0;

      if (voucherCode) {
        const voucher = await Voucher.findOne({
          CODE: voucherCode,
          STATUS: true,
        });

        if (voucher) {
          // Kiểm tra ngày hết hạn của voucher
          if (new Date() > new Date(voucher.EXPIRATION_DATE)) {
            return res.status(400).json({
              success: false,
              message: "Voucher đã hết hạn.",
            });
          }

          // Kiểm tra nếu voucher còn lượt sử dụng
          if (voucher.USAGE_LIMIT <= 0) {
            return res.status(400).json({
              success: false,
              message: "Voucher đã đạt đến giới hạn sử dụng.",
            });
          }

          discountPercent = voucher.DISCOUNT_PERCENT || 0;

          // Giảm 1 ở trường USAGE_LIMIT sau khi sử dụng voucher
          voucher.USAGE_LIMIT -= 1;
          await voucher.save();
          await VoucherController.updateVoucherStatusFromUsage();
        } else {
          return res.status(404).json({
            success: false,
            message: "Voucher không tồn tại hoặc không hợp lệ.",
          });
        }
      }

      // Tính tổng giá cho các bàn được chọn
      const totalPrice = selectedTablesData.reduce((total, table) => {
        const totalFoodPrice = table.LIST_FOOD.reduce((foodTotal, food) => {
          const foodPrice = food.FOOD_ID ? food.FOOD_ID.PRICE : 0;
          return foodTotal + (foodPrice * food.QUANTITY || 0);
        }, 0);

        const totalServicePrice = table.SERVICES.reduce(
          (serviceTotal, service) => {
            return service.SERVICES_ID
              ? serviceTotal + service.SERVICES_ID.servicePrice
              : serviceTotal;
          },
          0
        );

        return (
          total + totalFoodPrice + totalServicePrice + (table.TABLE_PRICE || 0)
        );
      }, 0);

      // Áp dụng giảm giá từ voucher
      const finalPrice = totalPrice * (1 - discountPercent / 100);

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
        TOTAL_PRICE: finalPrice,
        STATUS: "NotYetPaid",
        BOOKING_TYPE: "Website",
      });

      await newBooking.save();

      // Kiểm tra xem có chọn hết các bàn trong giỏ hàng hay không
      if (selectedTables.length === cart.LIST_TABLES.length) {
        await Cart.findOneAndDelete({ USER_ID: userId });
      } else {
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

  async getMonthlyRevenue(req, res) {
    try {
      // Lấy năm từ query params hoặc mặc định là năm hiện tại
      const year = parseInt(req.query.year) || new Date().getFullYear();

      // Sử dụng MongoDB Aggregation để tính tổng doanh thu theo tháng
      const monthlyRevenueData = await Booking.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${year}-01-01`),
              $lt: new Date(`${year + 1}-01-01`),
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" }, // Nhóm theo tháng của createdAt
            totalRevenue: { $sum: "$TOTAL_PRICE" }, // Tính tổng TOTAL_PRICE cho mỗi tháng
          },
        },
        {
          $sort: { _id: 1 }, // Sắp xếp theo tháng tăng dần
        },
      ]);

      // Tạo mảng với doanh thu của từng tháng, đảm bảo đủ 12 tháng (ngay cả khi không có doanh thu cho tháng đó)
      const monthlyRevenue = Array(12).fill(0); // Khởi tạo mảng 12 phần tử với giá trị 0
      monthlyRevenueData.forEach((item) => {
        monthlyRevenue[item._id - 1] = item.totalRevenue; // Gán tổng doanh thu cho tháng tương ứng
      });

      // Trả về kết quả
      return res.status(200).json({
        success: true,
        year,
        monthlyRevenue,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi tính tổng doanh thu theo tháng",
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

  async getTotalBookingAmountByUser(req, res) {
    try {
      const userId = req.user_id;
      const totalAmount = await BookingService.getTotalBookingAmountByUser(
        userId
      );
      res.status(200).json({
        success: true,
        totalAmount: totalAmount.totalAmount || 0, // Trả về 0 nếu không có booking
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tổng số tiền đã dùng của người dùng",
        error: error.message,
      });
    }
  }
  async getMonthlyBookingStats(req, res) {
    const { year } = req.query;
    const currentYear = new Date().getFullYear();
    const selectedYear = year ? parseInt(year) : currentYear;

    try {
      const stats = await BookingService.getMonthlyBookingStats(selectedYear);
      res.status(200).json({
        success: true,
        year: selectedYear,
        monthlyStats: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new BookingController();
