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
        // Chuyển đổi selectedDate và selectedBookingTime sang đối tượng moment với định dạng chính xác
        const selectedMomentDate = moment(selectedDate, "YYYY-MM-DD", true);
        const selectedMomentBookingTime = moment(
          selectedBookingTime,
          "YYYY-MM-DD HH:mm",
          true
        );

        // Lọc các BOOKING_TIMES trong cùng ngày
        const bookingTimesOnSelectedDate = table.BOOKING_TIMES.filter(
          (booking) => {
            const bookingStartTime = moment(
              booking.START_TIME,
              "YYYY-MM-DD HH:mm",
              true
            );
            return bookingStartTime.isSame(selectedMomentDate, "day");
          }
        );

        // Kiểm tra nếu bàn có `STATUS` là "Completed"
        const isCompleted = bookingTimesOnSelectedDate.some(
          (bookingTimeObj) => bookingTimeObj.STATUS === "Completed"
        );

        if (isCompleted) {
          return true; // Bỏ qua các kiểm tra khác, vì bàn có `STATUS` là "Completed"
        }

        // Kiểm tra thời gian trùng lặp
        const isTimeAvailable = bookingTimesOnSelectedDate.every(
          (bookingTimeObj) => {
            const existingTime = moment(
              bookingTimeObj.START_TIME,
              "YYYY-MM-DD HH:mm",
              true
            );
            const diffInHours = Math.abs(
              existingTime.diff(selectedMomentBookingTime, "hours")
            );
            return diffInHours >= 3; // Đảm bảo cách ít nhất 3 giờ
          }
        );

        return isTimeAvailable;
      });

      res.status(200).json({ success: true, data: availableTables });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateTable(req, res) {
    try {
      const tableId = req.params.tableId;
      const updateData = req.body;
      const updatedTable = await TableService.updateTable(tableId, updateData);
      res.status(200).json({ success: true, data: updatedTable });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteTable(req, res) {
    try {
      const tableId = req.params.tableId;
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
  async getAllTablesAdmin(req, res) {
    try {
      const tables = await Table.find({ IS_DELETED: false }); // Lấy tất cả bàn chưa bị xóa
      return res.status(200).json(tables); // Trả về danh sách bàn
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bàn:", error);
      return res.status(500).json({ message: "Lỗi khi lấy danh sách bàn." });
    }
  }

  async updateBookingTimeStatus(req, res) {
    const { tableId, startTime } = req.body; // Nhận dữ liệu từ body

    if (!tableId || !startTime) {
      return res.status(400).json({ message: "Thiếu tableId hoặc startTime." });
    }

    try {
      // Gọi service để cập nhật STATUS
      const updatedTable = await TableService.updateBookingTimeStatus(
        tableId,
        startTime
      );

      res.status(200).json({
        message: "Cập nhật trạng thái thành công.",
        data: updatedTable,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: `Lỗi khi cập nhật trạng thái: ${error.message}` });
    }
  }

  async checkAndUpdateBookingTimeStatus(req, res) {
    try {
      const result = await TableService.updateBookingTimeStatusIfOverdue();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllTablesWithStatus(req, res) {
    try {
      // Lấy toàn bộ danh sách bàn
      const tables = await TableService.getAllTables();

      // Lấy thời gian hiện tại
      const currentTime = moment();

      // Duyệt qua từng bàn để xác định trạng thái
      const tablesWithStatus = tables.map((table) => {
        let status = "Đang trống"; // Mặc định là Đang trống

        // Duyệt qua từng thời gian đặt để kiểm tra trạng thái
        for (let bookingTime of table.BOOKING_TIMES) {
          const startTime = moment(bookingTime.START_TIME, "YYYY-MM-DD HH:mm");
          const hoursDiff = currentTime.diff(startTime, "hours");

          // Kiểm tra trạng thái dựa trên sự khác biệt về giờ
          if (
            startTime.isSame(currentTime, "minute") ||
            (hoursDiff > 0 && hoursDiff < 3)
          ) {
            status = "Đang có khách";
            break; // Nếu đã tìm thấy trạng thái Đang có khách, không cần kiểm tra thêm
          } else if (
            startTime.isAfter(currentTime) &&
            hoursDiff > -3 &&
            hoursDiff <= 0
          ) {
            status = "Sắp có khách";
          }
        }

        // Thêm trường trạng thái vào kết quả trả về
        return {
          ...table,
          CURRENT: status,
        };
      });

      // Trả về kết quả với trạng thái của từng bàn
      return res.status(200).json({
        success: true,
        data: tablesWithStatus,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bàn:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách bàn.",
      });
    }
  }

  async getTotalStartTime(req, res) {
    try {
      const totalStartTime = await TableService.countTotalStartTime();
      return res.json({ success: true, totalStartTime });
    } catch (error) {
      return res.status(500).json({ success: false, msg: error.message });
    }
  }

  async getTotalStartTimes(req, res) {
    try {
      const totalStartTimes = await TableService.countStartTimesForAllTables();
      return res.json({ success: true, data: totalStartTimes });
    } catch (error) {
      console.error("Lỗi khi lấy tổng START_TIME:", error);
      return res.status(500).json({ success: false, msg: error.message });
    }
  }
}

module.exports = new TableController();
