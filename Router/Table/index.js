const express = require("express");
const router = express.Router();
const TABLE_CONTROLLER = require("../../Controllers/Table/Table.Controller");

router.post("/createTable", TABLE_CONTROLLER.createTable);
router.delete("/deleteTable/:tableId", TABLE_CONTROLLER.deleteTable);
router.get("/allTable", TABLE_CONTROLLER.getAllTables);
router.get("/groupedTables", TABLE_CONTROLLER.getGroupedTables);
router.get("/oneTable", TABLE_CONTROLLER.getTable);
router.put("/updateTable/:tableId", TABLE_CONTROLLER.updateTable);
router.get("/allTableWithoutDate", TABLE_CONTROLLER.getAllTableWithoutDate);

module.exports = router;
