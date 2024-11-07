const Booking = require("../../Models/Booking/Booking.Model");
const Voucher = require("../../Models/Voucher/Voucher.Model");
const Cart = require("../../Models/Cart/Cart.Model");
const Table = require("../../Models/Table/Table.Model");
const Table_Service = require("../../Services/Table/Table.Service");
const USER_MODEL = require("../../Models/User/User.Model");
const moment = require("moment");
const MAIL_QUEUE = require("../../Utils/sendMail");
const mongoose = require("mongoose");

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
  // async updateBookingStatus(bookingId, status) {
  //   try {
  //     return await Booking.findByIdAndUpdate(
  //       bookingId,
  //       { STATUS: status },
  //       { new: true }
  //     );
  //   } catch (error) {
  //     throw new Error("Error updating booking status: " + error.message);
  //   }
  // }

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

      // Lấy thông tin người dùng dựa trên USER_ID từ booking
      const user = await USER_MODEL.findById(booking.USER_ID);
      if (!user || !user.EMAIL)
        throw new Error("Không tìm thấy người dùng hoặc email không tồn tại");

      booking.STATUS = status;
      await booking.save();

      const pointsToAdd = Math.round(booking.TOTAL_PRICE / 100000);

      user.CUMULATIVE_POINTS += pointsToAdd;
      await user.save();

      for (let table of booking.LIST_TABLES) {
        await this.updateRoomAvailability(
          table.TABLE_ID,
          table.BOOKING_TIME,
          booking.USER_ID
        );
      }

      // Gửi email xác nhận nếu trạng thái là 'Booked'
      if (status === "Booked") {
        const emailContent = `
  <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <!-- Header -->
    <div style="background-color: #34495E; color: #fff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">TFood</h1>
    </div>
    <!-- Body -->
    <div style="padding: 20px; background-color: #f8f9fa;">
      <h2 style="color: #34495E; font-size: 22px;">Xin chào ${user.FULLNAME},</h2>
      <p style="color: #555; font-size: 16px;">Chúc mừng bạn đã đặt bàn thành công với mã đơn hàng <strong>${bookingId}</strong>. Chi tiết đơn hàng như sau:</p>
      <div style="background-color: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <ul style="list-style: none; padding: 0; color: #34495E;">
          <li style="margin-bottom: 10px; font-size: 16px;">
            <strong>Tên khách hàng:</strong> ${booking.USER_NAME}
          </li>
          <li style="margin-bottom: 10px; font-size: 16px;">
            <strong>Thời gian đặt bàn:</strong> ${booking.LIST_TABLES[0].BOOKING_TIME}
          </li>
          <li style="font-size: 16px;">
            <strong>Tổng tiền:</strong> ${booking.TOTAL_PRICE} VND
          </li>
        </ul>
      </div>
      <p style="color: #555; font-size: 16px;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    </div>
    <!-- Footer -->
    <div style="background-color: #34495E; color: #fff; padding: 10px; text-align: center;">
      <p style="margin: 0; font-size: 14px;">&copy; 2024 TFood. All rights reserved.</p>
    </div>
  </div>
`;

        // Đưa email vào hàng đợi
        await MAIL_QUEUE.enqueue({
          email: user.EMAIL,
          otp: "", // Không cần OTP cho xác nhận booking
          otpType: "BookingConfirmation",
          content: emailContent,
        });
      }

      return {
        statusCode: 200,
        msg: `Trạng thái booking đã được cập nhật thành ${status}`,
        data: booking,
        user,
      };
    } catch (error) {
      return {
        statusCode: 500,
        msg: "Có lỗi xảy ra khi cập nhật trạng thái booking",
        error: error.message,
      };
    }
  }

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
      } else {
        console.log("Thời gian đã được đặt trước:", bookingTime);
      }

      // Lưu các thay đổi
      await table.save();
    } catch (error) {
      console.error("Có lỗi xảy ra khi cập nhật bàn:", error);
      throw new Error(`Có lỗi xảy ra khi cập nhật bàn: ${error.message}`);
    }
  }

  async bookTableNows(userId, tablesDetails, bookingType = "Website") {
    let listTables = [];
    let totalPrice = 0;

    const isSingleTable = !Array.isArray(tablesDetails);

    if (isSingleTable) {
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
        throw new Error("Ngày trả bàn phải lớn hơn ngày nhận bàn.");
      }

      const totalPriceRoom = days * room.PRICE_PERNIGHT;

      listRooms.push({
        ROOM_ID: roomId,
        START_DATE: checkInDate,
        END_DATE: checkOutDate,
        TOTAL_PRICE_FOR_ROOM: room.PRICE_PERNIGHT,
      });

      // Cộng tổng giá vào tổng giá booking
      totalPrice += totalPriceRoom;
    }

    const booking = new BOOKING_MODEL({
      USER_ID: userId,
      LIST_ROOMS: listRooms,
      TOTAL_PRICE: totalPrice,
      STATUS: "NotYetPaid",
      BOOKING_TYPE: bookingType,
      CUSTOMER_PHONE: roomsDetails[0].CUSTOMER_PHONE,
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

        const formattedBookingTime =
          moment(BOOKING_TIME).format("YYYY-MM-DD HH:mm");

        // Sử dụng toán tử arrayFilters với toán tử $[<identifier>]
        await Table.updateOne(
          {
            _id: TABLE_ID,
          },
          {
            $set: { "BOOKING_TIMES.$[elem].STATUS": "Completed" },
          },
          {
            arrayFilters: [
              {
                "elem.START_TIME": formattedBookingTime,
                "elem.USER_ID": userId,
              },
            ],
          }
        );
      }

      return booking; // Trả về thông tin Booking sau khi cập nhật
    } catch (error) {
      throw new Error(
        `Error updating booking and table status: ${error.message}`
      );
    }
  }

  async getAllBookings() {
    try {
      await this.updateAllBookingsStatus();
      // Sử dụng populate để lấy dữ liệu liên kết từ các bảng khác (User, Table, ServiceTable, Food)
      const bookings = await Booking.find()
        .populate("USER_ID", "FULLNAME EMAIL") // Populate user information
        .populate("LIST_TABLES.TABLE_ID", "TABLE_NUMBER") // Populate table information
        .populate("LIST_TABLES.SERVICES.SERVICES_ID", "serviceName") // Populate services
        .populate("LIST_TABLES.LIST_FOOD.FOOD_ID", "NAME PRICE"); // Populate food details

      return bookings;
    } catch (error) {
      throw new Error("Error while retrieving bookings: " + error.message);
    }
  }
  async getTablesInBookingWithTime(bookingId) {
    // Tìm booking theo ID và populate các thông tin về Table trong LIST_TABLES
    const booking = await Booking.findById(bookingId).populate(
      "LIST_TABLES.TABLE_ID USER_ID"
    );

    if (!booking) return null;

    // Lọc các bảng và chỉ giữ lại thông tin TABLE_ID, BOOKING_TIME và STATUS phù hợp
    const tablesWithMatchingTime = booking.LIST_TABLES.map((tableInfo) => {
      const { TABLE_ID, BOOKING_TIME } = tableInfo;
      const tableDetails = TABLE_ID.BOOKING_TIMES.find(
        (bookingTime) => bookingTime.START_TIME === BOOKING_TIME
      );

      // Nếu tìm thấy tableDetails, lấy STATUS, nếu không thì gán là "Pending"
      const status = tableDetails ? tableDetails.STATUS : "Pending";
      const userId = tableDetails ? tableDetails.USER_ID : null;

      // Lọc chỉ lấy các thông tin cần thiết
      return {
        TABLE_ID: TABLE_ID._id,
        BOOKING_TIME: BOOKING_TIME, // Lấy thời gian booking từ LIST_TABLES
        TABLE_NUMBER: TABLE_ID.TABLE_NUMBER,
        USER_ID: userId, //
        STATUS: status, // Trả về STATUS
      };
    });

    return tablesWithMatchingTime;
  }

  async updateAllBookingsStatus() {
    try {
      // Lấy tất cả các booking
      const bookings = await Booking.find().populate("LIST_TABLES.TABLE_ID");

      for (const booking of bookings) {
        // Lấy danh sách các tables từ LIST_TABLES trong booking
        const tables = booking.LIST_TABLES;

        // Kiểm tra trạng thái của từng table
        const allCompleted = await Promise.all(
          tables.map(async (table) => {
            const tableDetails = await Table.findById(table.TABLE_ID);

            // Kiểm tra từng thời gian đặt trong BOOKING_TIMES
            const isCompleted = tableDetails.BOOKING_TIMES.some(
              (bookingTime) =>
                bookingTime.START_TIME === table.BOOKING_TIME &&
                bookingTime.STATUS === "Completed"
            );

            return isCompleted;
          })
        );

        // Nếu tất cả các table đều có status là Completed, cập nhật STATUS của booking
        if (allCompleted.every((status) => status)) {
          booking.STATUS = "Completed";
          await booking.save();
        } else {
          booking.STATUS = "Booked";
          await booking.save();
        }
      }
    } catch (error) {
      console.error("Error updating booking statuses:", error.message);
    }
  }

  async getTotalFoodQuantity() {
    try {
      const result = await Booking.aggregate([
        { $unwind: "$LIST_TABLES" }, // Tách từng phần tử trong LIST_TABLES thành từng document riêng
        { $unwind: "$LIST_TABLES.LIST_FOOD" }, // Tách từng phần tử trong LIST_FOOD thành từng document riêng
        {
          $group: {
            _id: "$LIST_TABLES.LIST_FOOD.FOOD_ID",
            totalQuantity: { $sum: "$LIST_TABLES.LIST_FOOD.QUANTITY" },
          },
        },
        {
          $lookup: {
            from: "foods", // Tên collection foods
            localField: "_id",
            foreignField: "_id",
            as: "foodDetails",
          },
        },
        {
          $project: {
            _id: 1,
            totalQuantity: 1,
            foodName: { $arrayElemAt: ["$foodDetails.NAME", 0] }, // Lấy tên món ăn từ foodDetails
          },
        },
      ]);

      return result;
    } catch (error) {
      throw new Error(
        "Error calculating total food quantity: " + error.message
      );
    }
  }

  async getTotalBookingAmountByUser(userId) {
    try {
      const result = await Booking.aggregate([
        { $match: { USER_ID: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: "$USER_ID",
            totalAmount: { $sum: "$TOTAL_PRICE" },
          },
        },
      ]);
      return result[0] || { totalAmount: 0 };
    } catch (error) {
      console.error(
        "Lỗi khi tính tổng số tiền đã dùng của người dùng:",
        error.message
      );
      throw new Error(
        "Lỗi khi tính tổng số tiền đã dùng của người dùng: " + error.message
      );
    }
  }
}

module.exports = new BookingService();
