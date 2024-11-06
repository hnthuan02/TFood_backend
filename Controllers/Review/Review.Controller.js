const REVIEW_SERVICE = require("../../Services/Review/Review.Service");
class REVIEW_CONTROLLER {
  async addReview(req, res) {
    try {
      const { bookingId, ratingFood, ratingService, comment } = req.body;
      const userId = req.user._id; // Lấy userId từ token (req.user)
      // Gọi hàm addReview từ service
      const review = await REVIEW_SERVICE.addReview(
        userId,
        bookingId,
        ratingFood,
        ratingService,
        comment
      );
      return res.json({ success: true, msg: "Đánh giá thành công", review });
    } catch (error) {
      console.error("Lỗi khi thêm đánh giá:", error);
      return res.status(400).json({ success: false, msg: error.message });
    }
  }
  async getReviewsByBookingId(req, res) {
    try {
      const { bookingId } = req.params;
      const reviews = await REVIEW_SERVICE.getReviewsByBookingId(bookingId);
      if (!reviews || reviews.length === 0) {
        return res.status(404).json({
          success: false,
          msg: "Không có đánh giá nào cho bàn này.",
        });
      }
      return res.json({ success: true, reviews });
    } catch (error) {
      console.error("Lỗi khi lấy đánh giá:", error);
      return res.status(500).json({ success: false, msg: error.message });
    }
  }
  async getReviewByUser(req, res) {
    try {
      const userId = req.user_id;
      const { bookingId } = req.body;
      const review = await REVIEW_SERVICE.getReviewByUser(userId, bookingId);

      if (!review) {
        return res
          .status(404)
          .json({ success: false, msg: "Người dùng chưa đánh giá bàn này." });
      }

      return res.json({ success: true, review });
    } catch (error) {
      console.error("Lỗi khi lấy đánh giá:", error);
      return res.status(500).json({ success: false, msg: error.message });
    }
  }
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { ratingFood, ratingService, comment } = req.body;
      const userId = req.user._id; // Lấy từ token xác thực
      const updatedReview = await REVIEW_SERVICE.updateReview(
        reviewId,
        userId,
        ratingFood,
        ratingService,
        comment
      );
      return res.json({
        success: true,
        msg: "Chỉnh sửa đánh giá thành công",
        review: updatedReview,
      });
    } catch (error) {
      console.error("Lỗi khi chỉnh sửa đánh giá:", error);
      return res.status(400).json({ success: false, msg: error.message });
    }
  }

  async getAllReviews(req, res) {
    try {
      const reviews = await REVIEW_SERVICE.getAllReviews();
      return res.json({ success: true, reviews });
    } catch (error) {
      console.error("Lỗi khi lấy toàn bộ đánh giá:", error);
      return res.status(500).json({ success: false, msg: error.message });
    }
  }

  async updateReviewStatus(req, res) {
    try {
      const { reviewId } = req.params;
      const { status } = req.body; // true hoặc false

      const updatedReview = await REVIEW_SERVICE.updateReviewStatus(
        reviewId,
        status
      );
      return res.json({
        success: true,
        msg: "Thay đổi trạng thái đánh giá thành công",
        review: updatedReview,
      });
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái đánh giá:", error);
      return res.status(400).json({ success: false, msg: error.message });
    }
  }

  async getApprovedReviews(req, res) {
    try {
      const approvedReviews = await REVIEW_SERVICE.getApprovedReviews();
      return res.json({ success: true, reviews: approvedReviews });
    } catch (error) {
      console.error("Lỗi khi lấy các đánh giá đã duyệt:", error);
      return res.status(500).json({ success: false, msg: error.message });
    }
  }
}
module.exports = new REVIEW_CONTROLLER();
