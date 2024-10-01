const express = require("express");
const router = express.Router();
const BookingController = require("../../Controllers/Booking/Booking.Controller");
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

module.exports = router;
