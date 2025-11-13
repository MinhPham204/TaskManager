const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        },
    });

    const mailOptions = {
      from: `"Task Manager" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      // Nếu options.text có giá trị, nó sẽ gửi text
      text: options.text, 
      // Nếu options.html có giá trị, nó sẽ gửi HTML
      html: options.html, 
    };

    await transporter.sendMail(mailOptions);

    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error("Email not sent:", error);
    throw new Error("Email not sent");
  }
};

module.exports = sendEmail;