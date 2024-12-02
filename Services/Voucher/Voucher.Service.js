const Voucher = require("../../Models/Voucher/Voucher.Model");

class VoucherService {
  // Thêm mới voucher
  async createVoucher(data) {
    const newVoucher = new Voucher(data);
    await newVoucher.save();
    return newVoucher;
  }

  // Cập nhật voucher
  async updateVoucher(voucherId, updateData) {
    const updatedVoucher = await Voucher.findByIdAndUpdate(
      voucherId,
      updateData,
      { new: true }
    );
    return updatedVoucher;
  }

  // Xóa voucher
  async deleteVoucher(voucherId) {
    const deletedVoucher = await Voucher.findByIdAndDelete(voucherId);
    return deletedVoucher;
  }

  async getAllVouchers() {
    const vouchers = await Voucher.find({});
    await this.checkAndUpdateVoucherStatus();
    return vouchers;
  }

  async updateVoucherStatus(voucherId, status) {
    const voucher = await Voucher.findByIdAndUpdate(
      voucherId,
      { STATUS: status },
      { new: true }
    );
    if (!voucher) {
      throw new Error("Không tìm thấy voucher.");
    }
    return voucher;
  }

  async checkAndUpdateVoucherStatus() {
    try {
      // Lấy tất cả các voucher
      const vouchers = await Voucher.find({});

      // Duyệt qua từng voucher để kiểm tra ngày hết hạn và cập nhật trạng thái
      for (const voucher of vouchers) {
        if (new Date(voucher.EXPIRATION_DATE) < new Date()) {
          // Nếu ngày hết hạn nhỏ hơn ngày hiện tại, cập nhật STATUS thành false (Expired)
          await Voucher.findByIdAndUpdate(voucher._id, { STATUS: false });
        }
      }

      return {
        success: true,
        message: "Voucher statuses updated successfully.",
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new VoucherService();
