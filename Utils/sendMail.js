const nodemailer = require("nodemailer");
const USER_SERVICE = require("../Services/User/User.Service");
const USER_MODEL = require("../Models/User/User.Model");
const dotenv = require("dotenv");
dotenv.config();

class MailQueue {
  constructor() {
    this.queue = [];
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  enqueue(item) {
    this.queue.push(item);
    this.pendingSend();
  }

  async pendingSend() {
    const run = async () => {
      await this.run_send();
      this.dequeue();
    };
    run();
  }

  async ResendOtp(email) {
    return this.sendVerifyEmail(email, "Resend_Otp");
  }

  async run_send() {
    const notification = this.peek();
    if (notification) {
      await this.sendMail(
        notification.email,
        notification.otp,
        notification.otpType
      );
    }
  }

  dequeue() {
    this.queue.shift();
  }

  peek() {
    return this.queue[0];
  }

  get length() {
    return this.queue.length;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  async addToMailQueue(email, otp, otpType) {
    try {
      await this.enqueue({ email, otp, otpType });
    } catch (error) {
      console.error(error);
    }
  }

  async sendVerifyEmail(email, otpType) {
    try {
      const otp = await this.randomOtp();
      const expTime = new Date();
      expTime.setMinutes(expTime.getMinutes() + 5);

      await USER_SERVICE.updateUserOTP(email, otp, otpType, expTime);

      await this.addToMailQueue(email, otp, otpType);
      return true;
    } catch (error) {
      console.error("Error sending verification email:", error);
    }
  }

  async sendForgotPasswordEmail(email) {
    return this.sendVerifyEmail(email, "reset_password");
  }

  async ResendOtp(email) {
    return this.sendVerifyEmail(email, "Resend_Otp");
  }

  // async verifyOTP(email, otp) {
  //     try {
  //         await USER_SERVICE.updateOTPstatus(email, otp);
  //     } catch (error) {
  //         console.error("Error verifying OTP:", error);
  //     }
  // }

  async verifyOTP(email, otp, otpType) {
    try {
      // Tìm người dùng với địa chỉ email và mã OTP truyền vào
      const user = await USER_MODEL.findOne({ EMAIL: email, "OTP.CODE": otp });

      if (!user) {
        throw new Error("Invalid OTP");
      }

      // Kiểm tra loại và thời hạn của mã OTP
      const otpDetail = user.OTP.find(
        (item) => item.CODE === otp && item.TYPE === otpType
      );
      const currentTime = Date.now();

      if (!otpDetail) {
        throw new Error("Invalid OTP type");
      }

      if (otpDetail.EXP_TIME < currentTime) {
        throw new Error("OTP expired");
      }

      return true; // Trả về true nếu OTP hợp lệ và chưa hết hạn
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw error;
    }
  }

  async randomOtp() {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async HTML_TEMPLATE(otp, otpType) {
    let message;
    if (otpType === "create_account") {
      message = `
            <h2>Để hoàn thành đăng ký, xác nhận địa chỉ email bằng mã otp sau:</h2>
            <p style="font-size: 24px; font-weight: bold; color: #FAE8B2;">${otp}</p>
        `;
    } else if (otpType === "reset_password") {
      message = `
            <h2>Để đặt lại mật khẩu, sử dụng mã otp sau:</h2>
            <p style="font-size: 24px; font-weight: bold; color: #FAE8B2;">${otp}</p>
        `;
    } else if (otpType === "edit_account") {
      message = `
            <h2>Để thay đổi email, sử dụng mã otp sau:</h2>
            <p style="font-size: 24px; font-weight: bold; color: #FAE8B2;">${otp}</p>
        `;
    } else if (otpType === "booking") {
      message = `
              <h2>To edit your account, use this code:</h2>
              <p style="font-size: 24px; font-weight: bold; color: #FAE8B2;">${otp}</p>
          `;
    } else {
      message = `
            <h2>Here is your OTP code:</h2>
            <p style="font-size: 24px; font-weight: bold; color: #FAE8B2;">${otp}</p>
        `;
    }

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>OTP Verification</title>
            <link href="https://fonts.googleapis.com/css?family=Lato:300,400,700" rel="stylesheet">
            <style>
                /* Reset styles */
                body, table, td, a {
                    -webkit-text-size-adjust: 100%;
                    -ms-text-size-adjust: 100%;
                }
                table, td {
                    mso-table-rspace: 0pt;
                    mso-table-lspace: 0pt;
                }
                img {
                    -ms-interpolation-mode: bicubic;
                }
                a {
                    text-decoration: none !important; /* Bỏ gạch chân và định dạng mặc định */
                    color: inherit !important; /* Không cho phép email client thay đổi màu liên kết */
                }
                /* Remove extra space added to emails by some clients */
                body {
                    margin: 0;
                    padding: 0;
                    width: 100% !important;
                    height: 100% !important;
                    background-color: #2b1b17; /* Nền đỏ thẫm */
                    font-family: 'Lato', sans-serif;
                    color: #FAE8B2; /* Màu chữ vàng sáng */
                }
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #3c2f2f; /* Màu nền thẻ */
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                }
                .email-header {
                    text-align: center;
                    padding: 10px 0;
                }
                .email-header h1 {
                    font-size: 28px;
                    color: #FAE8B2; /* Màu chữ vàng sáng */
                    margin: 0;
                    text-transform: uppercase;
                }
                .email-body {
                    text-align: center;
                    padding: 20px;
                    font-size: 18px;
                    line-height: 1.5;
                }
                .email-body h2 {
                    font-size: 22px;
                    color: #FAE8B2;
                }
                .email-body p {
                    font-size: 16px;
                    color: #FAE8B2;
                }
                .email-footer {
                    text-align: center;
                    padding: 20px;
                    font-size: 12px;
                    color: #FAE8B2;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 20px;
                    font-size: 16px;
                    font-weight: bold;
                    color: #FAE8B2 !important; /* Màu chữ vàng nhạt */
                    background-color: #c0392b !important; /* Nền nút đỏ thẫm */
                    border: none;
                    border-radius: 5px;
                    text-transform: uppercase;
                    cursor: pointer;
                    margin-top: 20px;
                    text-decoration: none;
                    transition: background-color 0.3s ease;
                }
                .btn:hover {
                    background-color: #a93226 !important;
                }
                /* Responsive styles */
                @media only screen and (max-width: 600px) {
                    .email-container {
                        width: 100% !important;
                        padding: 10px;
                    }
                    .email-body {
                        font-size: 16px;
                    }
                    .email-body h2 {
                        font-size: 20px;
                    }
                    .email-body p {
                        font-size: 14px;
                    }
                    .btn {
                        padding: 10px 15px;
                        font-size: 14px;
                    }
                }
            </style>
        </head>
        <body>
            <center style="width: 100%; background-color: #34495E;">
                <div class="email-container">
                    <div class="email-header">
                        <h1>TFOOD-Verify</h1>
                    </div>
                    <div class="email-body">
                        <img src="https://res.cloudinary.com/dphhcgg3y/image/upload/v1726816041/logoMail_ax7ndw.png" alt="OTP Verification" style="width: 100%; max-width: 200px; margin: auto;">
                        ${message}
                        <a href="#" class="btn" style="
                          display: inline-block;
                          padding: 12px 20px;
                          font-size: 16px;
                          font-weight: bold;
                          color: #FAE8B2 !important; /* Màu chữ vàng nhạt */
                          background-color: #7D002E !important; /* Nền nút đỏ thẫm */
                          border: none;
                          border-radius: 5px;
                          text-transform: uppercase;
                          cursor: pointer;
                          margin-top: 20px;
                          text-decoration: none !important;
                          transition: background-color 0.3s ease;
                        ">Verify Now</a>
                    </div>
                    <div class="email-footer">
                        <p>If you did not request this email, please ignore it.</p>
                        <p>© 2024 e-Verify. All rights reserved.</p>
                    </div>
                </div>
            </center>
        </body>
        </html>
    `;
  }

  async sendMail(email, otp, otpType) {
    try {
      await this.transporter.sendMail({
        from: `"Noreply" <${process.env.EMAIL_USERNAME}>`,
        to: email,
        subject: "OTP Verification",
        html: await this.HTML_TEMPLATE(otp, otpType),
      });
      console.log("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }
}

module.exports = new MailQueue();
