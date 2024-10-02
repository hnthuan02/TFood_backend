const BookingService = require("../../Services/Booking/Booking.Service");

class BookingController {
  // Tạo booking từ giỏ hàng
  async createBookingFromCart(req, res) {
    try {
      const userId = req.user_id; // Lấy userId từ token
      const { userName, phoneNumber, email } = req.body; // Lấy thông tin người dùng từ frontend

      // Kiểm tra xem các thông tin người dùng đã được cung cấp chưa
      if (!userName || !phoneNumber || !email) {
        return res.status(400).json({
          success: false,
          message:
            "Thiếu thông tin người dùng (USER_NAME, PHONE_NUMBER, EMAIL)",
        });
      }

      // Tạo booking từ giỏ hàng và thông tin người dùng
      const booking = await BookingService.createBookingFromCart(
        userId,
        userName,
        phoneNumber,
        email
      );

      return res.status(201).json({
        success: true,
        data: booking,
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
}

module.exports = new BookingController();
