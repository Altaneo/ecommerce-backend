require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
let otpStore = {};
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

const sendOtp = async (emailOrPhone) => {
  const otp = generateOtp();
  otpStore[emailOrPhone] = otp;

  if (emailOrPhone.includes("@")) {
    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailOrPhone,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}`,
    });
  } 
};

const verifyOtp = (emailOrPhone, otp) => {
  return otpStore[emailOrPhone] === otp;
};

module.exports = {
  sendOtp,
  verifyOtp,
};
