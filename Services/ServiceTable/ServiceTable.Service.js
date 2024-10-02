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
      const deletedService = await ServiceTable.findByIdAndDelete(id);
      if (!deletedService) {
        throw new Error("Service table not found.");
      }
      return deletedService;
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
      const services = await ServiceTable.find();
      return services;
    } catch (error) {
      throw new Error("Error fetching all service tables: " + error.message);
    }
  }
}

module.exports = new ServiceTableService();
