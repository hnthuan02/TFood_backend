const Booking = require("../../Models/Booking/Booking.Model");
const Cart = require("../../Models/Cart/Cart.Model");
const Table = require("../../Models/Table/Table.Model");
const Table_Service = require("../../Services/Table/Table.Service");
const moment = require("moment");

class BookingService {
  async createBookingFromCart(userId, userName, phoneNumber, email) {
    try {
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
        throw new Error("Cart is empty.");
      }

      const listTables = cart.LIST_TABLES;

      // Tính tổng giá
      const totalPrice = listTables.reduce((total, table) => {
        // Tính tổng giá món ăn
        const totalFoodPrice = table.LIST_FOOD.reduce((foodTotal, food) => {
          const foodPrice = food.FOOD_ID ? food.FOOD_ID.PRICE : 0;
          return foodTotal + (foodPrice * food.QUANTITY || 0);
        }, 0);

        // Tính tổng giá dịch vụ
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

      const newBooking = new Booking({
        USER_ID: userId,
        USER_NAME: userName,
        PHONE_NUMBER: phoneNumber,
        EMAIL: email,
        LIST_TABLES: listTables.map((table) => ({
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
      await Cart.findOneAndDelete({ USER_ID: userId });

      return newBooking;
    } catch (error) {
      throw new Error("Error creating booking from cart: " + error.message);
    }
  }

  // Lấy danh sách booking theo userId
  async getBookingsByUserId(userId) {
    try {
      return await Booking.find({ USER_ID: userId })
        .populate({
          path: "LIST_TABLES.TABLE_ID",
          model: "Table", // Model của bảng `Table`
          select: "TABLE_NUMBER PRICE CAPACITY DESCRIPTION IMAGES", // Các trường bạn muốn hiển thị từ `Table`
        })
        .populate({
          path: "LIST_TABLES.LIST_FOOD.FOOD_ID",
          model: "Food", // Model của bảng `Food`
          select: "NAME PRICE", // Các trường bạn muốn hiển thị từ `Food`
        })
        .populate({
          path: "LIST_TABLES.SERVICES.SERVICES_ID",
          model: "ServiceTable", // Model của bảng `Food`
          select: "serviceName servicePrice", // Các trường bạn muốn hiển thị từ `Food`
        });
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

  async updateBookingStatus({ bookingId, status }) {
    try {
      // Tìm booking bằng ID
      const booking = await Booking.findById(bookingId);
      if (!booking) throw new Error("Không tìm thấy đơn đặt bàn");

      // Cập nhật trạng thái của đơn đặt phòng
      booking.STATUS = status;
      await booking.save();

      // Cập nhật trạng thái phòng trong LIST_ROOMS của đơn đặt phòng
      for (let table of booking.LIST_TABLES) {
        await this.updateRoomAvailability(
          table.TABLE_ID,
          table.BOOKING_TIME,
          booking.USER_ID
        );
      }

      return {
        statusCode: 200,
        msg: `Trạng thái booking đã được cập nhật thành ${status}`,
        data: booking,
      };
    } catch (error) {
      return {
        statusCode: 500,
        msg: "Có lỗi xảy ra khi cập nhật trạng thái booking",
        error: error.message,
      };
    }
  }

  // Cập nhật AVAILABILITY của các phòng đã đặt
  async updateRoomAvailability(tableId, bookingTime, user_id) {
    try {
      // Tìm bàn bằng ID
      const table = await Table.findById(tableId);
      if (!table) throw new Error("Không tìm thấy bàn");

      // Kiểm tra xem bookingTime đã tồn tại trong BOOKING_TIMES chưa
      const isAlreadyBooked = table.BOOKING_TIMES.some(
        (booking) => booking.START_TIME.toString() === bookingTime.toString()
      );

      if (!isAlreadyBooked) {
        // Nếu chưa, thêm vào mảng BOOKING_TIMES
        table.BOOKING_TIMES.push({
          START_TIME: bookingTime,
          USER_ID: user_id,
        });
      }

      // Lưu các thay đổi
      await table.save();
    } catch (error) {
      throw new Error(`Có lỗi xảy ra khi cập nhật bàn: ${error.message}`);
    }
  }

  async bookTableNows(userId, tablesDetails, bookingType = "Website") {
    let listTables = [];
    let totalPrice = 0;

    // Kiểm tra nếu chỉ có một phòng (object) hoặc nhiều phòng (array)
    const isSingleTable = !Array.isArray(tablesDetails);

    if (isSingleTable) {
      // Trường hợp chỉ có một phòng
      tablesDetails = [tablesDetails]; // Chuyển object thành mảng để xử lý dễ hơn
    }

    for (const tableDetails of tablesDetails) {
      const tableId = tableDetails.tableId || tableDetails.TABLE_ID;
      const table = await Table_Service.getTableById(tableId);

      if (!table) {
        throw new Error("Bàn không tồn tại.");
      }

      // Tính số ngày ở
      const checkInDate = new Date(roomDetails.startDate);
      const checkOutDate = new Date(roomDetails.endDate);
      const days = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24); // Tính số ngày ở

      if (days <= 0) {
        throw new Error("Ngày trả phòng phải lớn hơn ngày nhận phòng.");
      }

      // Tính tổng giá cho từng phòng
      const totalPriceRoom = days * room.PRICE_PERNIGHT;

      // Thêm phòng vào danh sách phòng trong booking
      listRooms.push({
        ROOM_ID: roomId,
        START_DATE: checkInDate,
        END_DATE: checkOutDate,
        TOTAL_PRICE_FOR_ROOM: room.PRICE_PERNIGHT,
      });

      // Cộng tổng giá vào tổng giá booking
      totalPrice += totalPriceRoom;
    }

    // Tạo booking mới với thông tin phòng
    const booking = new BOOKING_MODEL({
      USER_ID: userId,
      LIST_ROOMS: listRooms, // Danh sách các phòng đã đặt
      TOTAL_PRICE: totalPrice, // Tổng giá cho tất cả các phòng
      STATUS: "NotYetPaid",
      BOOKING_TYPE: bookingType, // Loại đặt phòng (ví dụ: Website)
      CUSTOMER_PHONE: roomsDetails[0].CUSTOMER_PHONE, // Thông tin khách hàng (lấy từ phòng đầu tiên)
      CUSTOMER_NAME: roomsDetails[0].CUSTOMER_NAME,
      CITIZEN_ID: roomsDetails[0].CITIZEN_ID,
    });

    // Lưu booking vào database
    await booking.save();

    return booking;
  }

  async updateBookingAndTableStatus(bookingId) {
    try {
      // Tìm Booking theo ID
      const booking = await Booking.findById(bookingId).populate(
        "LIST_TABLES.TABLE_ID"
      );

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Cập nhật STATUS của Booking thành Completed
      booking.STATUS = "Completed";
      await booking.save();

      // Cập nhật STATUS của tất cả các bàn trong LIST_TABLES
      for (const tableInfo of booking.LIST_TABLES) {
        const { TABLE_ID, BOOKING_TIME } = tableInfo;
        const userId = booking.USER_ID;

        // Tìm và cập nhật STATUS của Table theo BOOKING_TIME và USER_ID
        await Table.updateOne(
          {
            _id: TABLE_ID,
            "BOOKING_TIMES.START_TIME": BOOKING_TIME,
            "BOOKING_TIMES.USER_ID": userId,
          },
          { $set: { "BOOKING_TIMES.$.STATUS": "Completed" } }
        );
      }

      return booking; // Trả về thông tin Booking sau khi cập nhật
    } catch (error) {
      throw new Error(
        `Error updating booking and table status: ${error.message}`
      );
    }
  }
}

module.exports = new BookingService();
