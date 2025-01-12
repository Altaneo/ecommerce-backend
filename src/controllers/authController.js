const Cart = require('../models/cartModel');
const otpService = require('../services/otpService');
const userService = require('../services/userService');
const User = require('../models/User')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const admin = require('../services/firebaseAdmin');
const JWT_SECRET = 'altaneofin@123';
const { saveProductsForUser } = require('../services/productServices');
// Check if the user exists in the database
exports.checkUser = async (req, res) => {
  const { emailOrPhone } = req.body;

  try {
    const user = await userService.findUser(emailOrPhone);
    if (user) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking user' });
  }
};

// Save user information if new and send OTP
exports.sendOtp = async (req, res) => {
  const { emailOrPhone, userInfo } = req.body;

  try {
    const user = await userService.findUser(emailOrPhone);
    
    if (!user) {
      // Save user details if user does not exist
      await userService.saveUser(userInfo);
    }

    // Send OTP
    await otpService.sendOtp(emailOrPhone);
    res.status(200).json({ message: 'OTP sent successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { emailOrPhone, otp } = req.body;

  try {
    const isOtpValid = await otpService.verifyOtp(emailOrPhone, otp);
    if (isOtpValid) {
    const token = jwt.sign({ emailOrPhone }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    }); // Use secure: true in production for HTTPS
      res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'OTP verification failed' });
  }
};
exports.saveUser = async (req, res) => {
  const userInfo = req.body;

  try {
    const user = await userService.saveUser(userInfo);
    res.status(201).json({ message: 'User saved successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save user' });
  }
};
exports.signOut = (req, res) => {
  try {
    // Clear the authToken cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    res.status(200).json({ message: 'Sign out successful' });
  } catch (error) {
    console.error('Error during sign out:', error);
    res.status(500).json({ message: 'Failed to sign out' });
  }
};
exports.checkAuth = async (req, res) => {
  const authToken = req.cookies.authToken;
  if (!authToken) {
    return res.status(200).json({ authenticated: false });
  }
  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    const user = await User.findOne({
      $or: [
        { email: decoded.email },
        { email: decoded.emailOrPhone },
        { phone: decoded.user_json_phone }
      ],
    });
    
    if (!user) {
      return res.status(404).json({ authenticated: false, message: 'User not found' });
    }

    // Fetch cart items for the authenticated user
    const cartItems = await Cart.find({ userId: decoded.uid });

    // Save or update cart items in the user's cart field
    if (cartItems && cartItems.length > 0) {
      await saveProductsForUser(user, cartItems);
    }

    res.status(200).json({
      authenticated: true,
      message: 'User authenticated and cart items saved to user',
    });
  } catch (error) {
    console.error('Invalid auth token or saving products failed:', error);
    res.status(200).json({ authenticated: false });
  }
};

exports.verifyFirebaseToken = async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name } = decodedToken;
    // Check if the user already exists in the database
    const user = await User.findOne({email:email});
    // Save the user if user is null or if email and name are provided
    if (!user) {
      // Ensure email and name are valid before saving
      if (email && name) {
        const newUser = new User({email,name,phone:''});

        // Save the user to the database
        await newUser.save();
      } else {
        return res.status(400).json({
          success: false,
          message: 'Email and name are required to create a user.',
        });
      }
    }

    // Create a custom JWT
    const jwtToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

    // Set the JWT token in cookies
    res.cookie('authToken', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 3600000, // 1 hour in milliseconds
    });

    res.status(200).json({
      success: true,
      user: { email, name },
      message: 'User authenticated and token set in cookies',
    });
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

exports.updateProfile = async (req, res) => {
  const { userId } = req.user;
  const { name, email, phone, gender, address } = req.body;

  try {
    if (email || phone) {
      const existingUser = await userService.findUser(email || phone);
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: 'Email or phone already in use' });
      }
    }
    const updatedUser = await userService.updateUser(userId, { name, email, phone, gender, address });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
exports.checkAuthMiddleware = (req, res, next) => {
  const authToken = req.cookies.authToken;

  if (!authToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decodedToken = jwt.verify(authToken, JWT_SECRET);
    req.user = { userId: decodedToken.email || decodedToken.user_json_phone || decodedToken.emailOrPhone };
    next();
  } catch (error) {
    console.error('Invalid auth token:', error);
    res.status(401).json({ message: 'Invalid authentication token' });
  }
};
exports.fetchUserProfile = async (req, res) => {
  const { userId } = req.user;
  try {
    const user = await userService.findUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'User profile fetched successfully',
      user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};
exports.updateUserProfile = async (req, res) => {
  const { name, gender, address, email, phone, uid } = req.body;

  try {
    const updatedUser = await userService.updateUser(uid, { name, gender, email, phone, address });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
};
exports.verifyPhoneUser = async(req, res) => {
  const { user_json_url,user_json_phone } = req.body;

  if (!user_json_url) {
      return res.status(400).send({ error: 'user_json_url is required' });
  }

  const user = await User.findOne({phone:user_json_phone});
    // Save the user if user is null or if email and name are provided
    if (!user) {
        const newUser = new User({email:'',phone:user_json_phone});
        await newUser.save();
      }
  const jwtToken = jwt.sign({ user_json_phone }, JWT_SECRET, { expiresIn: '1h' });

    // Set the JWT token in cookies
    res.cookie('authToken', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 3600000, // 1 hour in milliseconds
    });

  res.status(200).send("success fully verifyoone number");
};