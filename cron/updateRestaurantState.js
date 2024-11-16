const cron = require("node-cron");
const tableService = require("../Services/Table/Table.Service");
const userService = require("../Services/User/User.Service");

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

cron.schedule("0 0 1 1,7 *", async () => {
  console.log("Running job to reset cumulative points...");
  await userService.resetCumulativePoints();
});
