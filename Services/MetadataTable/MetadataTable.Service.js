const MetadataTable = require("../../Models/MetadataTable/MetadataTable.Model");

class MetadataTableService {
  // Hàm để tăng TOTAL_BOOKING lên 1
  async incrementTotalBooking(tableId) {
    try {
      // Tìm và cập nhật TOTAL_BOOKING của bảng dựa vào TABLE_ID
      const result = await MetadataTable.findOneAndUpdate(
        { TABLE_ID: tableId },
        { $inc: { TOTAL_BOOKING: 1 } }, // Tăng TOTAL_BOOKING lên 1
        { new: true, upsert: true } // Trả về document sau khi cập nhật và tạo mới nếu chưa tồn tại
      );

      return result;
    } catch (error) {
      console.error("Lỗi khi cập nhật TOTAL_BOOKING:", error);
      throw new Error("Không thể cập nhật TOTAL_BOOKING");
    }
  }
}

module.exports = new MetadataTableService();
