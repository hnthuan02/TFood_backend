const BookingService = require("../../Services/Booking/Booking.Service");

class BookingController {
  // Tạo booking từ giỏ hàng
  async createBookingFromCart(req, res) {
    try {
      const userId = req.user_id; // Lấy userId từ token

      const booking = await BookingService.createBookingFromCart(userId);

      return res.status(201).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
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
