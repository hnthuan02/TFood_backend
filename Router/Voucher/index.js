const express = require("express");
const router = express.Router();
const voucherController = require("../../Controllers/Voucher/Voucher.Controller");
const {
  verifyToken,
  verifyTokenAdmin,
} = require("../../Middleware/verifyToken");
const authorizeRoles = require("../../Middleware/authorizeRoles");

router.post("/create", voucherController.createVoucher);
router.put("/edit/:id", voucherController.updateVoucher);
router.delete("/delete/:id", voucherController.deleteVoucher);
router.get("/getAll", voucherController.getAllVouchers);
router.patch("/updateStatus/:voucherId", voucherController.updateVoucherStatus);
router.post(
  "/checkEligibility",
  verifyToken,
  voucherController.checkVoucherEligibility
);

module.exports = router;
