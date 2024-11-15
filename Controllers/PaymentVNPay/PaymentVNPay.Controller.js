const moment = require("moment");
const BOOKING_SERVICE = require("../../Services/Booking/Booking.Service");

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

class PaymentController {
  //[POST] /payment/vnpay/create_payment_url
  async createPaymentVnpayUrl(req, res) {
    try {
      const dataBooking = req.body; // Lấy dữ liệu booking từ body request

      if (!dataBooking) {
        return res.status(400).json({
          statusCode: 400,
          msg: "Thông tin booking không hợp lệ",
        });
      }

      let date = new Date();
      let createDate = moment(date).format("YYYYMMDDHHmmss");

      let ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

      let config = require("config");
      let tmnCode = config.get("vnp_TmnCode");
      let secretKey = config.get("vnp_HashSecret");
      let vnpUrl = config.get("vnp_Url");
      let returnUrl = config.get("vnp_ReturnUrl");
      let orderId = moment(date).format("DDHHmmss");

      let locale = "vn";
      let currCode = "VND";
      let vnp_Params = {};

      vnp_Params["vnp_Version"] = "2.1.0";
      vnp_Params["vnp_Command"] = "pay";
      vnp_Params["vnp_TmnCode"] = tmnCode;
      vnp_Params["vnp_Locale"] = locale;
      vnp_Params["vnp_CurrCode"] = currCode;
      vnp_Params["vnp_TxnRef"] = dataBooking.id;
      vnp_Params["vnp_OrderInfo"] = "Thanh toán đặt bàn: " + dataBooking.id;
      vnp_Params["vnp_OrderType"] = "Thanh toan VNPAY";
      vnp_Params["vnp_Amount"] = dataBooking.totalPrice * 100; // Tổng giá trị booking
      vnp_Params["vnp_ReturnUrl"] = returnUrl;
      vnp_Params["vnp_IpAddr"] = ipAddr;
      vnp_Params["vnp_CreateDate"] = createDate;

      vnp_Params = sortObject(vnp_Params);

      let querystring = require("qs");
      let signData = querystring.stringify(vnp_Params, { encode: false });
      let crypto = require("crypto");
      let hmac = crypto.createHmac("sha512", secretKey);
      let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnp_Params["vnp_SecureHash"] = signed;
      vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

      return res.status(200).json({
        statusCode: 200,
        msg: "Tạo liên kết thanh toán thành công",
        data: {
          url: vnpUrl,
        },
      });
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        msg: "Có lỗi xảy ra",
        error: error.message,
      });
    }
  }

  //[GET] /payment/vnpay/return
  async vnpayReturn(req, res) {
    try {
      let config = require("config");
      let querystring = require("qs");
      let crypto = require("crypto");

      var vnp_Params = req.query;
      var secureHash = vnp_Params["vnp_SecureHash"];

      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];

      vnp_Params = sortObject(vnp_Params);

      var secretKey = config.get("vnp_HashSecret");
      var signData = querystring.stringify(vnp_Params, { encode: false });
      var hmac = crypto.createHmac("sha512", secretKey);
      var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      var orderId = vnp_Params["vnp_TxnRef"].split("-")[0]; // Lấy orderId gốc
      var rspCode = vnp_Params["vnp_ResponseCode"];
      var additionalAmount = parseInt(vnp_Params["vnp_Amount"], 10) / 100; // Lấy số tiền bổ sung

      if (secureHash === signed) {
        if (rspCode == "00") {
          // Lấy thông tin booking
          const booking = await BOOKING_SERVICE.getBookingById(orderId);
          if (!booking) {
            return res.status(404).json({
              statusCode: 404,
              msg: "Không tìm thấy đơn hàng",
            });
          }

          // Nếu giao dịch bổ sung, cập nhật tổng tiền
          let isAdditionalPayment = vnp_Params["vnp_TxnRef"].includes("-");
          if (isAdditionalPayment) {
            await BOOKING_SERVICE.updateBookingTotalPrice({
              bookingId: orderId,
              additionalAmount,
            });
          }

          // Cập nhật trạng thái đơn hàng
          if (booking.STATUS !== "Booked") {
            await BOOKING_SERVICE.updateBookingStatus({
              bookingId: orderId,
              status: "Booked",
            });
          }

          if (isAdditionalPayment) {
            return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
          } else {
            return res.redirect(
              `${process.env.FRONTEND_URL}/user/booked?success=true`
            );
          }
        } else {
          // Giao dịch thất bại
          await BOOKING_SERVICE.updateBookingStatus({
            bookingId: orderId,
            status: "Cancelled",
          });

          return res.status(400).json({
            statusCode: 400,
            msg: "Giao dịch không thành công",
          });
        }
      } else {
        return res.status(500).json({
          statusCode: 500,
          msg: "Lỗi xác thực",
        });
      }
    } catch (error) {
      console.error("Error in vnpayReturn:", error.message);
      return res.status(500).json({
        statusCode: 500,
        msg: "Có lỗi xảy ra",
        error: error.message,
      });
    }
  }

  //[GET] /payment/vnpay/ipn
  async vnpayIpn(req, res) {
    try {
      var vnp_Params = req.query;
      var secureHash = vnp_Params["vnp_SecureHash"];
      console.log("vnp_Params:", vnp_Params);

      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];

      vnp_Params = sortObject(vnp_Params);

      var config = require("config");
      var secretKey = config.get("vnp_HashSecret");
      var querystring = require("qs");
      var signData = querystring.stringify(vnp_Params, { encode: false });
      var crypto = require("crypto");
      var hmac = crypto.createHmac("sha512", secretKey);
      var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      console.log("secureHash:", secureHash);
      console.log("signed:", signed);

      if (secureHash === signed) {
        const orderId = vnp_Params["vnp_TxnRef"].split("-")[0];
        var rspCode = vnp_Params["vnp_ResponseCode"];
        var additionalAmount = parseInt(vnp_Params["vnp_Amount"], 10) / 100;

        if (rspCode === "00") {
          const booking = await BOOKING_SERVICE.getBookingById(orderId);
          if (!booking) {
            return res.status(404).json({
              RspCode: "01",
              Message: "Không tìm thấy đơn hàng",
            });
          }

          // Cập nhật trạng thái nếu cần
          if (booking.STATUS !== "Booked") {
            await BOOKING_SERVICE.updateBookingStatus({
              bookingId: orderId,
              status: "Booked",
            });
          } else {
            await BOOKING_SERVICE.updateBookingTotalPrice({
              bookingId: orderId,
              additionalAmount,
            });
          }

          return res.status(200).json({ RspCode: "00", Message: "Success" });
        } else {
          return res
            .status(200)
            .json({ RspCode: "01", Message: "Transaction failed" });
        }
      } else {
        return res
          .status(200)
          .json({ RspCode: "97", Message: "Checksum failed" });
      }
    } catch (error) {
      console.error("Error in vnpayIpn:", error.message);
      return res.status(500).json({
        statusCode: 500,
        msg: "Có lỗi xảy ra",
        error: error.message,
      });
    }
  }

  async createAdditionalPaymentUrl(req, res) {
    try {
      const { bookingId, additionalAmount } = req.body; // Nhận bookingId và số tiền cần thanh toán thêm từ body request

      if (!bookingId || !additionalAmount || additionalAmount <= 0) {
        console.log(bookingId);
        console.log(additionalAmount);
        return res.status(400).json({
          statusCode: 400,
          msg: "Thông tin không hợp lệ",
        });
      }

      // Lấy thông tin đơn hàng từ bookingId
      const booking = await BOOKING_SERVICE.getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({
          statusCode: 404,
          msg: "Không tìm thấy đơn hàng",
        });
      }

      let date = new Date();
      let createDate = moment(date).format("YYYYMMDDHHmmss");

      let ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

      let config = require("config");
      let tmnCode = config.get("vnp_TmnCode");
      let secretKey = config.get("vnp_HashSecret");
      let vnpUrl = config.get("vnp_Url");
      let returnUrl = config.get("vnp_ReturnUrl");
      let orderId = moment(date).format("DDHHmmss");

      let locale = "vn";
      let currCode = "VND";
      let vnp_Params = {};

      vnp_Params["vnp_Version"] = "2.1.0";
      vnp_Params["vnp_Command"] = "pay";
      vnp_Params["vnp_TmnCode"] = tmnCode;
      vnp_Params["vnp_Locale"] = locale;
      vnp_Params["vnp_CurrCode"] = currCode;
      vnp_Params["vnp_TxnRef"] = `${bookingId}-${moment().format(
        "YYYYMMDDHHmmss"
      )}`;
      vnp_Params["vnp_OrderInfo"] =
        "Thanh toán bổ sung cho đơn hàng: " + bookingId;
      vnp_Params["vnp_OrderType"] = "Thanh toan VNPAY";
      vnp_Params["vnp_Amount"] = additionalAmount * 100; // Số tiền cần thanh toán thêm
      vnp_Params["vnp_ReturnUrl"] = returnUrl;
      vnp_Params["vnp_IpAddr"] = ipAddr;
      vnp_Params["vnp_CreateDate"] = createDate;

      vnp_Params = sortObject(vnp_Params);

      let querystring = require("qs");
      let signData = querystring.stringify(vnp_Params, { encode: false });
      let crypto = require("crypto");
      let hmac = crypto.createHmac("sha512", secretKey);
      let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnp_Params["vnp_SecureHash"] = signed;
      vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

      return res.status(200).json({
        statusCode: 200,
        msg: "Tạo liên kết thanh toán bổ sung thành công",
        data: {
          url: vnpUrl,
        },
      });
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        msg: "Có lỗi xảy ra",
        error: error.message,
      });
    }
  }
}
module.exports = new PaymentController();
