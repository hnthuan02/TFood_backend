const express = require("express");
const router = express.Router();
const ServiceTableController = require("../../Controllers/ServiceTable/ServiceTable.Controller");

// Thêm dịch vụ
router.post("/createServices", ServiceTableController.createServiceTable);

// Cập nhật dịch vụ
router.put("/edit/:id", ServiceTableController.updateServiceTable);

// Xóa dịch vụ
router.delete("/delete/:id", ServiceTableController.deleteServiceTable);

// Lấy danh sách dịch vụ theo type
router.get("/services", ServiceTableController.getServiceTablesByType);

// Lấy tất cả dịch vụ
router.get("/services/all", ServiceTableController.getAllServiceTables);

module.exports = router;
