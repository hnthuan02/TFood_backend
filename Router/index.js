const express = require("express");
const userRouter = require("./User");
const restaurantRouter = require("./Restaurant");
const foodRouter = require("./Food");
const cartRouter = require("./Cart");
const tableRouter = require("./Table");
const bookingRouter = require("./Booking");
const serviceTableRouter = require("./ServiceTable");

function route(app) {
  app.use("/users", userRouter);
  app.use("/restaurants", restaurantRouter);
  app.use("/foods", foodRouter);
  app.use("/carts", cartRouter);
  app.use("/tables", tableRouter);
  app.use("/booking", bookingRouter);
  app.use("/serviceTables", serviceTableRouter);
}

module.exports = route;
