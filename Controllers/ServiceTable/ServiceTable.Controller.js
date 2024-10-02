const ServiceTableService = require("../../Services/ServiceTable/ServiceTable.Service");

class ServiceTableController {
  // Thêm dịch vụ mới
  async createServiceTable(req, res) {
    try {
      const data = req.body;
      const service = await ServiceTableService.createServiceTable(data);
      res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Cập nhật dịch vụ theo ID
  async updateServiceTable(req, res) {
    try {
      const id = req.params.id;
      const data = req.body;
      const updatedService = await ServiceTableService.updateServiceTable(
        id,
        data
      );
      res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: updatedService,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Xóa dịch vụ theo ID
  async deleteServiceTable(req, res) {
    try {
      const id = req.params.id;
      await ServiceTableService.deleteServiceTable(id);
      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy danh sách dịch vụ theo type
  async getServiceTablesByType(req, res) {
    try {
      const { type } = req.query;
      const services = await ServiceTableService.getServiceTablesByType(type);
      res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy tất cả dịch vụ
  async getAllServiceTables(req, res) {
    try {
      const services = await ServiceTableService.getAllServiceTables();
      res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new ServiceTableController();
