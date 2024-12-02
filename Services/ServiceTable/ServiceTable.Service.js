const ServiceTable = require("../../Models/ServiceTable/ServiceTable.Model");

class ServiceTableService {
  // Thêm dịch vụ mới
  async createServiceTable(data) {
    try {
      const service = new ServiceTable(data);
      await service.save();
      return service;
    } catch (error) {
      throw new Error("Error creating service table: " + error.message);
    }
  }

  // Cập nhật dịch vụ theo ID
  async updateServiceTable(id, data) {
    try {
      const updatedService = await ServiceTable.findByIdAndUpdate(id, data, {
        new: true,
      });
      if (!updatedService) {
        throw new Error("Service table not found.");
      }
      return updatedService;
    } catch (error) {
      throw new Error("Error updating service table: " + error.message);
    }
  }

  // Xóa dịch vụ theo ID
  async deleteServiceTable(id) {
    try {
      const serviceTable = await ServiceTable.findById(id);
      if (!serviceTable) {
        throw new Error("Service table not found.");
      }

      // Cập nhật IS_DELETED thành true thay vì xóa bản ghi
      serviceTable.IS_DELETED = true;
      await serviceTable.save();

      return serviceTable;
    } catch (error) {
      throw new Error("Error deleting service table: " + error.message);
    }
  }

  // Lấy danh sách dịch vụ theo type (Room hoặc Normal)
  async getServiceTablesByType(type) {
    try {
      const services = await ServiceTable.find({ type });
      return services;
    } catch (error) {
      throw new Error(
        "Error fetching service tables by type: " + error.message
      );
    }
  }

  // Lấy tất cả dịch vụ
  async getAllServiceTables() {
    try {
      // Lọc các dịch vụ có IS_DELETED là false hoặc không có IS_DELETED
      const services = await ServiceTable.find({
        $or: [
          { IS_DELETED: { $ne: true } }, // Lọc những dịch vụ có IS_DELETED không phải là true
          { IS_DELETED: { $exists: false } }, // Lọc những dịch vụ không có trường IS_DELETED
        ],
      });

      return services;
    } catch (error) {
      throw new Error("Error fetching all service tables: " + error.message);
    }
  }
}

module.exports = new ServiceTableService();
