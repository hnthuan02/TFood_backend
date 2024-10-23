const Table = require("../../Models/Table/Table.Model");
const mongoose = require("mongoose");

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
}

module.exports = new TableService();
