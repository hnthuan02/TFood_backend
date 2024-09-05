const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;
const cors = require("cors");
const axios = require("axios");
const dbConnect = require("./Config/dbconnect");
const route = require("./Router");
require("./cron/updateRestaurantState");

dbConnect();

// Cấu hình CORS
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:3001"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ["Content-Type", "Authorization"], // Cải thiện với dạng mảng
  })
);

app.use(express.json());

// Sử dụng route từ router/index.js
route(app);

// Cấu hình body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
