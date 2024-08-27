const cron = require("node-cron");
const RESTAURANT_MODEL = require("../Models/Restaurant/Restaurant.Model");

cron.schedule("0 * * * *", async () => {
  try {
    const currentHour = new Date().getHours();
    const newState = currentHour >= 7 && currentHour < 22 ? "Open" : "Close";
    await RESTAURANT_MODEL.updateMany({}, { STATE: newState });
    console.log(`Restaurants updated to ${newState}`);
  } catch (error) {
    console.error(`Error updating restaurants: ${error.message}`);
  }
});
