const express = require("express");
const userRouter = require("./User");
const restaurantRouter = require("./Restaurant");

function route(app) {
  app.use("/users", userRouter);
  app.use("/restaurants", restaurantRouter);
}

module.exports = route;
