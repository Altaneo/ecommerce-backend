const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Razorpay = require('razorpay');
const { google } = require('googleapis');
const authRoutes = require('./routes/auth');
const jwt = require('jsonwebtoken');
const cartRoutes = require('./routes/cartRoutes');
const productRoutes = require('./routes/productRoutes');
const products = require('./Data/Data')
const Product = require('./models/Product')
const featureProducts = require('./Data/FeatureData')
const notificationsRoutes = require("./routes/notificationsRoutes");
const crypto = require('crypto');
const url = require('url');
dotenv.config();

const app = express();
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
// Middleware
app.use(cors({
    origin: 'http://localhost:3000'|| "http://localhost:5000", // Frontend origin
    credentials: true,
}));
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Fetch key ID from environment variables
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Fetch key secret from environment variables
});

app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET; // Use a secure secret for production

app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { secure: false } // Set to true if using HTTPS
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopApp', {})
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log("Error connecting to MongoDB:", err));

// Google OAuth2 client setup
app.use('/api/auth', authRoutes);
const oauth2Client = new google.auth.OAuth2(
    "873468664454-lok0irstn4qfg00r2n6hllgi81buvr3g.apps.googleusercontent.com",
    "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",
    'http://localhost:5000/oauth2callback'
);
const scopes = [
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];
const state = crypto.randomBytes(32).toString('hex');
app.get('/auth/youtube', (req, res) => {
    const state = crypto.randomBytes(32).toString('hex');
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
    res.redirect(authUrl);
});
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      res.send('Authentication successful! You can now interact with the YouTube API.');
  } catch (err) {
      res.status(500).send('Error authenticating: ' + err.message);
  }
});
app.get('/api/live-stream', async (req, res) => {
  const youtube = google.youtube({ version: 'v3', auth: 'AIzaSyDuXur_2n49Y16SeOu_i8b8LdQJgqJQhUw' });

  try {
    const liveResponse = await youtube.search.list({
      part: 'snippet',
      channelId: "UCoHCXJfVz-iJ4NeseTOZ3Gg",
      type: 'video',
      eventType: 'live',
    });
    
    // Fetch upcoming events
    const upcomingResponse = await youtube.search.list({
      part: 'snippet',
      channelId: "UCoHCXJfVz-iJ4NeseTOZ3Gg",
      type: 'video',
      eventType: 'upcoming',
    });
    
    // Combine the results
    const combinedResults = [
      ...liveResponse.data.items,
      ...upcomingResponse.data.items,
    ];
      res.json(combinedResults);
  } catch (err) {
      res.status(500).send('Error fetching channel live streams: ' + err.message);
  }
});

app.use('/api/cart', cartRoutes);
app.use('/api',productRoutes);
// app.get('/api/products', (req, res) => {
//   res.json(products.products);
// });
const saveProducts = async () => {
  try {
    for (const product of products.products) {
      // Use `findOneAndUpdate` to check and update the product if it exists, or create it if it doesn't
      await Product.findOneAndUpdate(
        { _id: product._id }, // Match based on the unique identifier
        { $set: product }, // Update fields with the new product data
        { upsert: true, new: true, runValidators: true } // Upsert ensures creation if not found, new returns updated doc, validators check schema
      );
    }

    console.log('Product save or update operation completed successfully');
  } catch (err) {
    // Log the error with meaningful context
    console.error('Error saving or updating products:', err);
  }
};

saveProducts();
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});
app.get('/api/featureProducts', (req, res) => {
  res.json(featureProducts.featureProducts);
});
app.use("/notifications", notificationsRoutes);
app.post('/create-order', async (req, res) => {
  const { amount } = req.body;
  const amountInPaise = parseInt(amount * 100, 10); // Convert to paise and ensure it's an integer

  if (isNaN(amountInPaise) || amountInPaise <= 0) {
    return res.status(400).json({ error: 'Invalid amount. Amount must be a positive number.' });
  }
  const options = {
    amount: amountInPaise, // Amount in paise (100 paise = 1 INR)
    currency: 'INR',
    receipt: 'receipt#1',
    payment_capture: 1
  };
  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});
app.post('/verify-signature', (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  const body = order_id + '|' + payment_id;
  const expected_signature = crypto
    .createHmac('sha256', 'MjIy5Slcn0NJ548HDjkZEblW')
    .update(body.toString())
    .digest('hex');

  if (expected_signature === signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
