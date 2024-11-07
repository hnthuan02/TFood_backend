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
}

module.exports = new VoucherService();
