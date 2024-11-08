const cron = require("node-cron");
const tableService = require("../Services/Table/Table.Service");

// Chạy cron job mỗi giờ
cron.schedule("0 * * * *", async () => {
  console.log("Cron job đang chạy");
  try {
    await tableService.updateBookingTimeStatusIfOverdue();

    //console.log("Đã cập nhật trạng thái booking time quá hạn.");
  } catch (error) {
    console.error("Lỗi khi chạy cron job:", error.message);
  }
});
