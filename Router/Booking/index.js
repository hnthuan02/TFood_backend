const express = require("express");
const router = express.Router();
const BookingController = require("../../Controllers/Booking/Booking.Controller");
const authorizeRoles = require("../../Middleware/authorizeRoles");
const {
  verifyToken,
  verifyTokenAdmin,
} = require("../../Middleware/verifyToken");

router.post(
  "/createBookingFromCart",
  verifyToken,
  BookingController.createBookingFromCart
);
router.get(
  "/getBookingsByUserId",
  verifyToken,
  BookingController.getBookingsByUserId
);
router.put(
  "/updateBookingStatus",
  verifyToken,
  BookingController.updateBookingStatus
);
router.put(
  "/updatePaymentStatus",
  verifyToken,
  BookingController.updatePaymentStatus
);

router.post(
  "/status/completed",
  verifyToken,
  authorizeRoles("ADMIN"),
  BookingController.updateBookingStatusAdmin
);
router.get("/total-price", BookingController.getTotalPrice);
router.get("/allBookings", BookingController.getAllBookings);
router.get("/:id/tables", BookingController.getTablesInBookingWithTime);
module.exports = router;
