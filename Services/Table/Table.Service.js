const Table = require("../../Models/Table/Table.Model");
const mongoose = require("mongoose");
const moment = require("moment");

class TableService {
  async createTable(data) {
    const newTable = new Table(data);
    return await newTable.save();
  }

  async getTableById(tableId) {
    return await Table.findById(tableId).lean();
  }

  async getAllTables(query) {
    return await Table.find(query).lean();
  }

  async updateTable(tableId, data) {
    const updatedTable = await Table.findByIdAndUpdate(tableId, data, {
      new: true,
    }).lean();
    if (!updatedTable) throw new Error("Table not found");
    return updatedTable;
  }

  async deleteTable(tableId) {
    const result = await Table.findByIdAndUpdate(
      tableId,
      { IS_DELETED: true },
      { new: true }
    ).lean();
    if (!result) throw new Error("Table not found");
    return result;
  }

  async updateBookingTimeStatus(tableId, startTime) {
    try {
      console.log("tableId:", tableId);
      console.log("startTime:", startTime);

      // Chuyển đổi tableId thành ObjectId
      const objectId = new mongoose.Types.ObjectId(tableId);

      // Tìm và cập nhật bảng
      const updatedTable = await Table.findOneAndUpdate(
        {
          _id: objectId, // Sử dụng ObjectId
          "BOOKING_TIMES.START_TIME": startTime, // Tìm đúng thời gian bắt đầu
        },
        {
          $set: { "BOOKING_TIMES.$.STATUS": "Completed" }, // Cập nhật STATUS thành Completed
        },
        { new: true }
      );

      if (!updatedTable) {
        throw new Error("Không tìm thấy bảng hoặc thời gian đặt không hợp lệ.");
      }

      return updatedTable;
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật trạng thái: ${error.message}`);
    }
  }
  async updateBookingTimeStatusIfOverdue() {
    try {
      // Lấy thời gian hiện tại
      const currentTime = moment();

      // Tìm các bảng có BOOKING_TIMES chưa hoàn thành hoặc chưa có STATUS
      const tables = await Table.find({
        BOOKING_TIMES: {
          $elemMatch: {
            START_TIME: { $exists: true },
            $or: [
              { STATUS: { $exists: false } },
              { STATUS: { $ne: "Completed" } },
            ],
          },
        },
      });

      // Kiểm tra số lượng bảng được tìm thấy
      console.log(`Number of tables found: ${tables.length}`);

      if (tables.length === 0) {
        return { message: "Không có bảng nào cần cập nhật." };
      }

      // Duyệt qua từng bảng để kiểm tra thời gian đặt
      for (const table of tables) {
        let isUpdated = false; // Biến để kiểm tra xem có cập nhật hay không

        for (let bookingTime of table.BOOKING_TIMES) {
          // Chuyển đổi START_TIME sang đối tượng moment với định dạng chính xác
          const startTime = moment(bookingTime.START_TIME, "YYYY-MM-DD HH:mm");

          // Thêm các dòng log để kiểm tra giá trị thời gian

          // Kiểm tra nếu thời gian hiện tại đã vượt qua 3 giờ so với START_TIME hoặc nếu START_TIME nhỏ hơn thời gian hiện tại
          if (
            currentTime.diff(startTime, "hours") >= 3 ||
            startTime.isBefore(currentTime)
          ) {
            // Nếu STATUS chưa tồn tại hoặc chưa là Completed, tạo mới và đặt thành "Completed"
            if (!bookingTime.STATUS || bookingTime.STATUS !== "Completed") {
              bookingTime.STATUS = "Completed";
              isUpdated = true; // Đánh dấu là có thay đổi
            }
          }
        }

        // Lưu cập nhật lại bảng nếu có sự thay đổi
        if (isUpdated) {
          await table.save();
          console.log(`Table ${table._id} has been updated.`);
        }
      }

      return { message: "Cập nhật trạng thái thành công." };
    } catch (error) {
      console.error(`Lỗi khi cập nhật trạng thái: ${error.message}`);
      throw new Error(`Lỗi khi cập nhật trạng thái: ${error.message}`);
    }
  }

  async countTotalStartTime() {
    try {
      // Sử dụng aggregate để tính tổng số lượng START_TIME trong BOOKING_TIMES
      const result = await Table.aggregate([
        { $unwind: "$BOOKING_TIMES" }, // Mở rộng mảng BOOKING_TIMES
        {
          $group: {
            _id: null, // Không nhóm theo trường nào
            totalStartTime: { $sum: 1 }, // Đếm số lượng START_TIME
          },
        },
      ]);

      // Trả về tổng số lượng START_TIME
      return result.length > 0 ? result[0].totalStartTime : 0;
    } catch (error) {
      console.error("Lỗi khi đếm tổng số START_TIME:", error);
      throw new Error("Không thể đếm tổng số START_TIME");
    }
  }

  async countStartTimesForAllTables() {
    try {
      // Tìm tất cả các bàn
      const tables = await Table.find();

      // Tạo mảng chứa kết quả với TABLE_ID và tổng số lượng START_TIME
      const result = tables.map((table) => {
        return {
          TABLE_ID: table._id,
          TABLE_NUMBER: table.TABLE_NUMBER,
          TOTAL_START_TIME: table.BOOKING_TIMES.length,
        };
      });

      return result;
    } catch (error) {
      console.error("Lỗi khi đếm START_TIME:", error);
      throw new Error("Không thể đếm tổng số lượng START_TIME");
    }
  }
}

module.exports = new TableService();
