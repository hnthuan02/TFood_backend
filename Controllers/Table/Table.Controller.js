const TableService = require("../../Services/Table/Table.Service");
const Table = require("../../Models/Table/Table.Model");
const moment = require("moment");

class TableController {
  async createTable(req, res) {
    try {
      const tableData = req.body;
      const newTable = await TableService.createTable(tableData);
      res.status(201).json({ success: true, data: newTable });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getGroupedTables(req, res) {
    try {
      const tables = await TableService.getAllTables({ IS_DELETED: false });

      // Nhóm các bảng theo TYPE và CAPACITY
      const groupedTables = tables.reduce((acc, table) => {
        const key = `${table.TYPE}_${table.CAPACITY}`;
        if (!acc[key]) {
          acc[key] = { ...table, QUANTITY: 1 };
        } else {
          acc[key].QUANTITY += 1;
        }
        return acc;
      }, {});

      res
        .status(200)
        .json({ success: true, data: Object.values(groupedTables) });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getTable(req, res) {
    try {
      const tableId = req.params.id;
      const table = await TableService.getTableById(tableId);
      if (!table) {
        return res
          .status(404)
          .json({ success: false, message: "Table not found" });
      }
      res.status(200).json({ success: true, data: table });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAllTableWithoutDate(req, res) {
    try {
      // Lấy tất cả các bàn mà không có bộ lọc ngày
      const tables = await TableService.getAllTables({ IS_DELETED: false });

      // Nhóm các bảng theo TYPE và CAPACITY và tính toán số lượng bàn
      const groupedTables = tables.reduce((acc, table) => {
        const key = `${table.TYPE}_${table.CAPACITY}`;
        if (!acc[key]) {
          acc[key] = { ...table, COUNT: 1 }; // Khởi tạo với COUNT = 1
        } else {
          acc[key].COUNT += 1; // Tăng COUNT nếu cùng TYPE và CAPACITY
        }
        return acc;
      }, {});

      // Trả về kết quả đã nhóm và có số lượng bàn
      res
        .status(200)
        .json({ success: true, data: Object.values(groupedTables) });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // async getAllTables(req, res) {
  //   try {
  //     const { date, people } = req.query; // Lấy ngày và số người từ query parameter

  //     if (!date) {
  //       return res
  //         .status(400)
  //         .json({ success: false, message: "Date is required" });
  //     }

  //     if (!people || isNaN(people)) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Number of people is required and must be a number",
  //       });
  //     }

  //     const selectedDate = new Date(date);
  //     const minPeople = parseInt(people, 10);
  //     const query = {
  //       IS_DELETED: false,
  //       CAPACITY: { $gte: minPeople }, // Đảm bảo CAPACITY lớn hơn hoặc bằng số người
  //     };
  //     const tables = await TableService.getAllTables(query);

  //     // Lọc các bàn có AVAILABLE là true trong ngày đã chọn
  //     const availableTables = tables.filter((table) =>
  //       table.AVAILABILITY.some(
  //         (availability) =>
  //           new Date(availability.DATE).toISOString().split("T")[0] ===
  //             selectedDate.toISOString().split("T")[0] && availability.AVAILABLE
  //       )
  //     );

  //     res.status(200).json({ success: true, data: availableTables });
  //   } catch (error) {
  //     res.status(400).json({ success: false, message: error.message });
  //   }
  // }

  async getAllTables(req, res) {
    try {
      const { date, people, bookingTime } = req.query; // Lấy ngày, số người, và thời gian đặt từ query parameters

      if (!date) {
        return res
          .status(400)
          .json({ success: false, message: "Date is required" });
      }

      if (!people || isNaN(people)) {
        return res.status(400).json({
          success: false,
          message: "Number of people is required and must be a number",
        });
      }

      if (!bookingTime) {
        return res.status(400).json({
          success: false,
          message: "Booking time is required",
        });
      }

      const selectedDate = moment(date).startOf("day"); // Lấy ngày được chọn
      const selectedBookingTime = moment(`${date} ${bookingTime}`); // Kết hợp ngày và thời gian đặt

      const minPeople = parseInt(people, 10);

      // Lấy tất cả các bàn phù hợp với số người và chưa bị xóa
      const tables = await TableService.getAllTables({
        IS_DELETED: false,
        CAPACITY: { $gte: minPeople }, // Đảm bảo CAPACITY lớn hơn hoặc bằng số người
      });

      // Lọc các bàn có sẵn, không bị trùng giờ trong cùng ngày với khoảng cách 3 giờ
      const availableTables = tables.filter((table) => {
        // Lọc các BOOKING_TIMES trong cùng ngày
        const bookingTimesOnSelectedDate = table.BOOKING_TIMES.filter(
          (booking) => moment(booking.START_TIME).isSame(selectedDate, "day")
        );

        // Kiểm tra nếu bàn có `STATUS` là "Completed", bỏ qua kiểm tra thời gian và coi như bàn đó khả dụng
        const isCompleted = bookingTimesOnSelectedDate.some(
          (bookingTimeObj) => bookingTimeObj.STATUS === "Completed"
        );

        if (isCompleted) {
          return true; // Bỏ qua các kiểm tra khác, vì bàn có `STATUS` là "Completed"
        }

        // Kiểm tra nếu tất cả các thời gian trong ngày đều cách ít nhất 3 giờ so với selectedBookingTime
        const isTimeAvailable = bookingTimesOnSelectedDate.every(
          (bookingTimeObj) => {
            const existingTime = moment(bookingTimeObj.START_TIME);
            const diffInHours = Math.abs(
              existingTime.diff(selectedBookingTime, "hours")
            );
            return diffInHours >= 3; // Đảm bảo cách ít nhất 3 giờ
          }
        );

        // Trả về bàn nếu thời gian không trùng với các thời gian đã đặt
        return isTimeAvailable;
      });

      res.status(200).json({ success: true, data: availableTables });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateTable(req, res) {
    try {
      const tableId = req.params.id;
      const updateData = req.body;
      const updatedTable = await TableService.updateTable(tableId, updateData);
      res.status(200).json({ success: true, data: updatedTable });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteTable(req, res) {
    try {
      const tableId = req.params.id;
      const deletedTable = await TableService.deleteTable(tableId);
      res.status(200).json({ success: true, data: deletedTable });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAvailableDates(req, res) {
    try {
      const availableDates = await Table.aggregate([
        { $unwind: "$AVAILABILITY" }, // Tách từng phần tử trong mảng AVAILABILITY thành các tài liệu riêng biệt
        { $match: { "AVAILABILITY.AVAILABLE": true } }, // Chỉ lấy những ngày có AVAILABLE là true
        {
          $group: {
            _id: "$AVAILABILITY.DATE", // Nhóm theo ngày
            tables: { $push: "$TABLE_NUMBER" }, // Đưa số bàn vào một mảng
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            tables: 1,
          },
        },
        { $sort: { date: 1 } }, // Sắp xếp theo ngày tăng dần
      ]);

      return res.status(200).json({
        success: true,
        data: availableDates,
      });
    } catch (error) {
      console.error("Error fetching available dates:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error fetching available dates.",
        error: error.message,
      });
    }
  }

  async getAvailableTablesByDate(req, res) {
    try {
      const { date } = req.query; // Lấy ngày từ query parameter

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date is required",
        });
      }

      // Tìm tất cả các bàn có ngày trống
      const tables = await Table.find({
        "AVAILABILITY.DATE": new Date(date),
        "AVAILABILITY.AVAILABLE": true,
      });

      return res.status(200).json({
        success: true,
        data: tables,
      });
    } catch (error) {
      console.error("Error fetching available tables by date:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error fetching available tables by date.",
        error: error.message,
      });
    }
  }
}

module.exports = new TableController();
