const TableService = require("../../Services/Table/Table.Service");

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

  async getAllTables(req, res) {
    try {
      const { date } = req.query; // Nhận ngày từ query parameter

      if (!date) {
        return res
          .status(400)
          .json({ success: false, message: "Date is required" });
      }

      const selectedDate = new Date(date);
      const query = { IS_DELETED: false }; // Chỉ lấy những bảng chưa bị xóa
      const tables = await TableService.getAllTables(query);

      // Lọc các bàn có AVAILABLE là true trong ngày đã chọn
      const availableTables = tables.filter((table) =>
        table.AVAILABILITY.some(
          (availability) =>
            new Date(availability.DATE).toISOString().split("T")[0] ===
              selectedDate.toISOString().split("T")[0] && availability.AVAILABLE
        )
      );

      // Gom các bảng có cùng TYPE và CAPACITY
      const groupedTables = availableTables.reduce((acc, table) => {
        const key = `${table.TYPE}_${table.CAPACITY}`;
        if (!acc[key]) {
          acc[key] = { ...table, COUNT: 1 };
        } else {
          acc[key].COUNT += 1;
        }
        return acc;
      }, {});

      const result = Object.values(groupedTables);
      res.status(200).json({ success: true, data: result });
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
}

module.exports = new TableController();
