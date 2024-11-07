const express = require("express");
const router = express.Router();
const REVIEW_CONTROLLER = require("../../Controllers/Review/Review.Controller");
const {
  verifyToken,
  verifyTokenAdmin,
} = require("../../Middleware/verifyToken");
router.post("/addReview", verifyToken, REVIEW_CONTROLLER.addReview);
router.get(
  "/getReviewsByRoomId/:roomId",
  REVIEW_CONTROLLER.getReviewsByBookingId
);
router.put(
  "/updateReview/:reviewId",
  verifyToken,
  REVIEW_CONTROLLER.updateReview
);
router.post(
  "/getReviewByUserAndBooking",
  verifyToken,
  REVIEW_CONTROLLER.getReviewByUser
);
router.get("/getAllReviews", REVIEW_CONTROLLER.getAllReviews);
router.post("/:reviewId/status", REVIEW_CONTROLLER.updateReviewStatus);
router.get("/approved", REVIEW_CONTROLLER.getApprovedReviews);
module.exports = router;
