const Booking = require("../../Models/Booking/Booking.Model");
const Cart = require("../../Models/Cart/Cart.Model");

class BookingService {
  async createBookingFromCart(userId) {
    try {
      // Lấy giỏ hàng của người dùng
      const cart = await Cart.findOne({ USER_ID: userId });
      if (!cart) {
        throw new Error("Cart is empty.");
      }

      const listTables = cart.LIST_TABLES;

      // Tính tổng giá
      const totalPrice = listTables.reduce((total, table) => {
        const tablePrice = table.SERVICES.reduce((serviceTotal, service) => {
          return serviceTotal + service.servicePrice;
        }, 0);
        return total + tablePrice;
      }, 0);

      // Tạo booking mới từ dữ liệu giỏ hàng
      const newBooking = new Booking({
        USER_ID: userId,
        LIST_TABLES: listTables,
        TOTAL_PRICE: totalPrice,
        PAYMENT_METHOD: "cash", // Mặc định là tiền mặt
      });

      // Lưu booking
      await newBooking.save();

      // Xóa giỏ hàng sau khi đã tạo booking
      await Cart.findOneAndDelete({ USER_ID: userId });

      return newBooking;
    } catch (error) {
      throw new Error("Error creating booking from cart: " + error.message);
    }
  }

  // Lấy danh sách booking theo userId
  async getBookingsByUserId(userId) {
    try {
      return await Booking.find({ USER_ID: userId });
    } catch (error) {
      throw new Error("Error fetching bookings: " + error.message);
    }
  }

  // Cập nhật trạng thái booking
  async updateBookingStatus(bookingId, status) {
    try {
      return await Booking.findByIdAndUpdate(
        bookingId,
        { STATUS: status },
        { new: true }
      );
    } catch (error) {
      throw new Error("Error updating booking status: " + error.message);
    }
  }

  // Cập nhật trạng thái thanh toán
  async updatePaymentStatus(bookingId, paymentStatus) {
    try {
      return await Booking.findByIdAndUpdate(
        bookingId,
        { PAYMENT_STATUS: paymentStatus },
        { new: true }
      );
    } catch (error) {
      throw new Error("Error updating payment status: " + error.message);
    }
  }
}

module.exports = new BookingService();
