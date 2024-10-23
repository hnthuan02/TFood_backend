const express = require("express");
const router = express.Router();
const TABLE_CONTROLLER = require("../../Controllers/Table/Table.Controller");

router.post("/createTable", TABLE_CONTROLLER.createTable);
router.delete("/deleteTable/:tableId", TABLE_CONTROLLER.deleteTable);
router.get("/allTable", TABLE_CONTROLLER.getAllTables);
router.get("/groupedTables", TABLE_CONTROLLER.getGroupedTables);
router.get("/oneTable/:id", TABLE_CONTROLLER.getTable);
router.post("/updateTable/:tableId", TABLE_CONTROLLER.updateTable);
router.get("/allTableWithoutDate", TABLE_CONTROLLER.getAllTableWithoutDate);
router.get("/available-dates", TABLE_CONTROLLER.getAvailableDates);
router.get("/available-by-date", TABLE_CONTROLLER.getAvailableTablesByDate);
router.get("/tables", TABLE_CONTROLLER.getAllTablesAdmin);
router.post("/booking-times/status", TABLE_CONTROLLER.updateBookingTimeStatus);

module.exports = router;
