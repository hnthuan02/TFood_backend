const REVIEW_MODEL = require("../../Models/Review/Review.Model");
const BOOKING_MODEL = require("../../Models/Booking/Booking.Model");
class REVIEW_SERVICE {
  async addReview(userId, bookingId, ratingFood, ratingService, comment) {
    const booking = await BOOKING_MODEL.findOne({
      _id: bookingId,
      USER_ID: userId,
    });
    if (!booking) {
      throw new Error("Không tìm thấy đơn đặt bàn");
    }

    const existingReview = await REVIEW_MODEL.findOne({
      BOOKING_ID: bookingId,
      USER_ID: userId,
    });
    if (existingReview) {
      throw new Error("Bạn đã đánh giá bàn này rồi");
    }

    const status = ratingFood <= 3 && ratingService <= 3 ? false : true;
    // Tạo và lưu đánh giá mới
    const newReview = new REVIEW_MODEL({
      USER_ID: userId,
      BOOKING_ID: bookingId,
      RATING_FOOD: ratingFood,
      RATING_SERVICE: ratingService,
      COMMENT: comment,
      STATUS: status, // Đánh giá được kích hoạt
    });
    await newReview.save();
    return newReview;
  }
  async getReviewsByBookingId(bookingId) {
    const reviews = await REVIEW_MODEL.find({ BOOKING_ID: bookingId }).populate(
      {
        path: "USER_ID",
        select: "FULLNAME",
      }
    );
    return reviews;
  }
  async updateReview(reviewId, userId, ratingFood, ratingService, comment) {
    const review = await REVIEW_MODEL.findOneAndUpdate(
      { _id: reviewId, USER_ID: userId },
      {
        RATING_FOOD: ratingFood,
        RATING_SERVICE: ratingService,
        COMMENT: comment,
      },
      { new: true }
    );
    if (!review) {
      throw new Error(
        "Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa."
      );
    }
    return review;
  }
  async getReviewByUser(userId, bookingId) {
    const review = await REVIEW_MODEL.findOne({
      USER_ID: userId,
      BOOKING_ID: bookingId,
    });
    return review;
  }

  async getAllReviews() {
    const reviews = await REVIEW_MODEL.find().populate({
      path: "USER_ID",
      select: "FULLNAME",
    });
    return reviews;
  }

  async updateReviewStatus(reviewId, status) {
    const review = await REVIEW_MODEL.findByIdAndUpdate(
      reviewId,
      { STATUS: status },
      { new: true }
    );
    if (!review) {
      throw new Error("Không tìm thấy đánh giá.");
    }
    return review;
  }

  async getApprovedReviews() {
    const approvedReviews = await REVIEW_MODEL.find({ STATUS: true }).populate({
      path: "USER_ID",
      select: "FULLNAME",
    });
    return approvedReviews;
  }
}
module.exports = new REVIEW_SERVICE();
