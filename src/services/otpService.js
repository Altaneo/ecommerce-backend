const nodemailer = require('nodemailer');
const twilio = require('twilio');
const crypto = require('crypto');

// Store OTPs temporarily (in-memory for demo purposes)
let otpStore = {};

// Configure nodemailer (for email)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pankaj@altaneofin.in',
    pass: 'gzgb qesj kido wacu',
  },
});

// Configure Twilio (for SMS)
const twilioClient = twilio('AC50bf64a4b1490261a2d816e3da8a521a', 'b0feb6ab15e25cfd2e5a65b0aeca6c88');

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

const sendOtp = async (emailOrPhone) => {
  const otp = generateOtp();
  otpStore[emailOrPhone] = otp;
  // Send OTP via email or phone
  if (emailOrPhone.includes('@')) {
    // Send OTP via email
    await transporter.sendMail({
      from: 'your-email@gmail.com',
      to: emailOrPhone,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`,
    });
  } else {
    // Send OTP via SMS
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}`,
      from: '+15005550006',
      to: emailOrPhone,
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
