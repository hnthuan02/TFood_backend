const Table = require("../../Models/Table/Table.Model");

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
}

module.exports = new TableService();
