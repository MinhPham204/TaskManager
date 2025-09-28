const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // có thể dùng: "hotmail", "yahoo", hoặc SMTP server riêng
      auth: {
        user: process.env.EMAIL_USER, // email gửi
        pass: process.env.EMAIL_PASS, // mật khẩu ứng dụng (app password)
      },
      tls: {
        rejectUnauthorized: false, // bỏ qua lỗi self-signed
        },
    });

    await transporter.sendMail({
      from: `"Task Manager" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Email not sent:", error);
    throw new Error("Email not sent");
  }
};

module.exports = sendEmail;
