const VoucherService = require("../../Services/Voucher/Voucher.Service");
const voucherService = require("../../Services/Voucher/Voucher.Service");
const User = require("../../Models/User/User.Model");
const Voucher = require("../../Models/Voucher/Voucher.Model");

class VoucherController {
  // Tạo mới voucher
  async createVoucher(req, res) {
    try {
      const voucherData = req.body;
      const voucher = await voucherService.createVoucher(voucherData);
      return res.status(201).json({
        success: true,
        data: voucher,
      });
    } catch (error) {
      console.error("Error creating voucher:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error creating voucher.",
        error: error.message,
      });
    }
  }

  // Cập nhật voucher
  async updateVoucher(req, res) {
    try {
      const voucherId = req.params.id;
      const updateData = req.body;
      const updatedVoucher = await voucherService.updateVoucher(
        voucherId,
        updateData
      );
      if (!updatedVoucher) {
        return res.status(404).json({
          success: false,
          message: "Voucher not found.",
        });
      }
      return res.status(200).json({
        success: true,
        data: updatedVoucher,
      });
    } catch (error) {
      console.error("Error updating voucher:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error updating voucher.",
        error: error.message,
      });
    }
  }

  // Xóa voucher
  async deleteVoucher(req, res) {
    try {
      const voucherId = req.params.id;
      const deletedVoucher = await voucherService.deleteVoucher(voucherId);
      if (!deletedVoucher) {
        return res.status(404).json({
          success: false,
          message: "Voucher not found.",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Voucher deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting voucher:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error deleting voucher.",
        error: error.message,
      });
    }
  }

  async getAllVouchers(req, res) {
    try {
      const vouchers = await voucherService.getAllVouchers();
      return res.status(200).json({
        success: true,
        data: vouchers,
      });
    } catch (error) {
      console.error("Error fetching vouchers:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error fetching vouchers.",
        error: error.message,
      });
    }
  }

  async updateVoucherStatus(req, res) {
    try {
      const { voucherId } = req.params;
      const { status } = req.body; // true hoặc false

      const updatedVoucher = await VoucherService.updateVoucherStatus(
        voucherId,
        status
      );
      return res.json({
        success: true,
        msg: "Thay đổi trạng thái voucher thành công",
        voucher: updatedVoucher,
      });
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái voucher:", error);
      return res.status(400).json({ success: false, msg: error.message });
    }
  }

  async checkVoucherEligibility(req, res) {
    try {
      const userId = req.user_id; // Lấy userId từ token
      const { code } = req.body; // Lấy mã voucher từ params

      // Tìm người dùng theo userId
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Người dùng không tồn tại." });
      }

      // Tìm voucher theo mã CODE
      const voucher = await Voucher.findOne({ CODE: code });
      if (!voucher) {
        return res
          .status(404)
          .json({ success: false, message: "Voucher không tồn tại." });
      }

      // Kiểm tra điểm của người dùng có đủ để dùng voucher không
      if (user.CUMULATIVE_POINTS >= voucher.REQUIRED_POINTS) {
        return res.status(200).json({
          success: true,
          eligible: true,
          discount_percent: voucher.DISCOUNT_PERCENT,
          message: "Người dùng đủ điểm để sử dụng voucher.",
        });
      } else {
        return res.status(200).json({
          success: true,
          eligible: false,
          discount_percent: voucher.DISCOUNT_PERCENT,
          message: "Người dùng không đủ điểm để sử dụng voucher.",
        });
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra điểm người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống.",
        error: error.message,
      });
    }
  }

  async updateVoucherStatusFromUsage() {
    try {
      const vouchersToUpdate = await Voucher.find({
        USAGE_LIMIT: 0,
        STATUS: true,
      });

      if (vouchersToUpdate.length > 0) {
        await Voucher.updateMany(
          { USAGE_LIMIT: 0, STATUS: true },
          { STATUS: false }
        );

        console.log(
          "Đã cập nhật trạng thái của các voucher có USAGE_LIMIT = 0 thành false."
        );
      } else {
        console.log("Không có voucher nào cần cập nhật.");
      }
    } catch (error) {
      console.error(
        "Đã xảy ra lỗi khi cập nhật trạng thái voucher:",
        error.message
      );
    }
  }
}

module.exports = new VoucherController();
