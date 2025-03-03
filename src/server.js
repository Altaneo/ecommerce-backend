const express = require("express");
const cors = require("cors");
const fs = require("fs")
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 });
const session = require("express-session");
const MongoStore = require("connect-mongo");
const Razorpay = require("razorpay");
const { google } = require("googleapis");
const multer = require("multer");
const path = require("path");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cartRoutes");
const productRoutes = require("./routes/productRoutes");
const Product = require("./models/Product");
const notificationsRoutes = require("./routes/notificationsRoutes");
const livestreamRoutes =require("./routes/livestream")
const selectedProductRoutes = require("./routes/selectedProductRoutes");
const messageRoutes = require("./routes/messageRoutes");
const crypto = require("crypto");
const http = require("http");
const socketIo = require("socket.io");
const i18nextMiddleware = require("i18next-http-middleware");
const i18n = require("./i18n");
const translateRoutes =require("./routes/translate")
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});
app.use("/uploads", express.static("uploads"));
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://libretranslate.com",
      "http://localhost:5000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" })); 
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shopApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 60000, // 60 seconds
  socketTimeoutMS: 60000,
});
app.use(
  session({
    secret: process.env.JWT_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);
app.use(i18nextMiddleware.handle(i18n));
app.use("/locales", express.static(path.join(__dirname, "locales")));
app.get("/api/hello", (req, res) => {
  res.json({ message: req.t("welcome") });
});
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api", productRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/live", livestreamRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/selected-products", selectedProductRoutes);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (extName && mimeType) {
      return cb(null, true);
    } else {
      return cb(new Error("Only images are allowed"));
    }
  },
});
app.post("/upload", upload.single("profilePicture"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});

app.use("/uploads", express.static("uploads"));
app.post("/create-order", async (req, res) => {
  const { amount } = req.body;
  const amountInPaise = parseInt(amount * 100, 10);

  if (isNaN(amountInPaise) || amountInPaise <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid amount. Amount must be a positive number." });
  }

  const options = {
    amount: amountInPaise,
    currency: "INR",
    receipt: "receipt#1",
    payment_capture: 1,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/verify-signature", (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  const body = order_id + "|" + payment_id;

  const expected_signature = crypto
    .createHmac("sha256", "MjIy5Slcn0NJ548HDjkZEblW")
    .update(body.toString())
    .digest("hex");

  if (expected_signature === signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID, 
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000/oauth2callback"
);
const scopes = [
  process.env.SCOPE1,
  process.env.SCOPE2,
];
const state = crypto.randomBytes(32).toString("hex");
app.get("/auth/youtube", (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  res.redirect(authUrl);
});
app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get channel ID
    const channelResponse = await google.youtube("v3").channels.list({
      auth: oauth2Client,
      part: "id",
      mine: true,
    });

    const channelId = channelResponse.data.items[0].id;
    req.session.tokens = tokens; // Store tokens in session
    req.session.channelId = channelId; // Store channel ID in session

    res.redirect("http://localhost:3000/home"); // Redirecting, so no need for res.send()
  } catch (err) {
    res.status(500).send("Error authenticating: " + err.message);
  }
});



const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });
app.use("/api", translateRoutes);

app.get("/api/live-streams", async (req, res) => {
  try {
    const cachedData = cache.get("liveStreams");
    if (cachedData) {
      return res.json(cachedData);
    }
    const eventTypes = ["completed", "upcoming", "live"]; // Past is just regular search
    const requests = [
      youtube.search.list({
        part: "snippet",
        channelId: CHANNEL_ID,
        type: "video",
      }), // Fetch past streams (general search)
      ...eventTypes.map((eventType) =>
        youtube.search.list({
          part: "snippet",
          channelId: CHANNEL_ID,
          type: "video",
          eventType,
        })
      ),
    ];
    const responses = await Promise.all(requests);
    const results = {
      past: responses[0].data.items,
      completed: responses[1].data.items,
      upcoming: responses[2].data.items,
      live: responses[3].data.items,
    };
    cache.set("liveStreams", results);
    res.json(results);
  } catch (err) {
    res.status(500).send("Error fetching live streams: " + err.message);
  }
});
const uploads = multer({ dest: "uploads/" }); 
app.post("/start-stream", upload.single("thumbnail"), async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { title, description, scheduledStartTime } = req.body;
    const selectedStartTime = new Date(scheduledStartTime);
    const now = new Date();
    const isImmediateStart = selectedStartTime <= now || selectedStartTime - now < 60000;
    const thumbnailPath = req.file ? req.file.path : null;

    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube("v3");
    console.log(title.en,description.en,"-----------fff")
    const requestBody = {
      snippet: {
        title: title.en || "Default Title",
        description: description.en || "Live streaming from my website",
        scheduledStartTime: isImmediateStart ? new Date().toISOString() : selectedStartTime.toISOString(),
      },
      status: { privacyStatus: "public" },
      contentDetails: { enableAutoStart: true },
    };

    const broadcast = await youtube.liveBroadcasts.insert({
      auth: oauth2Client,
      part: "snippet,contentDetails,status",
      requestBody,
    });

    // Create live stream
    const stream = await youtube.liveStreams.insert({
      auth: oauth2Client,
      part: "snippet,cdn",
      requestBody: {
        snippet: { title: title.en || "Live Stream" },
        cdn: {
          format: "1080p",
          ingestionType: "rtmp",
          resolution: "1080p",
          frameRate: "30fps",
        },
      },
    });

    // Bind live stream to broadcast
    await youtube.liveBroadcasts.bind({
      auth: oauth2Client,
      part: "id,contentDetails",
      id: broadcast.data.id,
      streamId: stream.data.id,
    });

    // Fetch live broadcast details to get liveChatId
    const broadcastDetails = await youtube.liveBroadcasts.list({
      auth: oauth2Client,
      part: "snippet",
      id: broadcast.data.id,
    });

    const liveChatId = broadcastDetails.data.items[0]?.snippet?.liveChatId;

    if (!liveChatId) {
      return res.status(500).json({ error: "Could not retrieve live chat ID" });
    }

    // Store liveChatId in session for later use
    req.session.liveChatId = liveChatId;
 

    // Upload thumbnail if available
    if (thumbnailPath) {
      try {
        const response = await youtube.thumbnails.set({
          auth: oauth2Client,
          videoId: broadcast.data.id,
          media: {
            body: fs.createReadStream(thumbnailPath),
          },
        });
        fs.unlinkSync(thumbnailPath); // Delete after upload
      } catch (err) {
        console.error("Error uploading thumbnail:", err);
      }
    }
 
    res.json({
      message: "Stream started successfully!",
      broadcastId: broadcast.data.id,
      streamId: stream.data.id,
      streamKey: stream.data.cdn.ingestionInfo.streamName,
      streamUrl: stream.data.cdn.ingestionInfo.ingestionAddress,
      liveChatId,
    });

  } catch (error) {
    console.error("Error starting live stream:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/get-live-chat/:broadcastId", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube("v3");

    // Get live chat ID
    const broadcast = await youtube.liveBroadcasts.list({
      auth: oauth2Client,
      part: "snippet",
      id: req.params.broadcastId,
    });

    const liveChatId = broadcast.data.items[0]?.snippet?.liveChatId;
    if (!liveChatId) {
      return res.status(404).json({ error: "No live chat found" });
    }
    const messages = await youtube.liveChatMessages.list({
      auth: oauth2Client,
      part: "snippet,authorDetails",
      liveChatId,
    });

    res.json(messages.data.items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/send-chat", async (req, res) => {
  try {
    const {liveChatId}=req.body
    if (!req.session.tokens) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube("v3");

    const { message, username } = req.body; // Get username from the request
    await youtube.liveChatMessages.insert({
      auth: oauth2Client,
      part: "snippet",
      requestBody: {
        snippet: {
          liveChatId,
          type: "textMessageEvent",
          textMessageDetails: { 
            messageText: `${message}`  // Add username in the message
          },
        },
      },
    });

    res.json({ success: true });

  } catch (error) {
    console.error("Error sending chat message:", error);
    res.status(500).json({ error: error.message });
  }
});


app.get("/api/get-live-video", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube("v3");

    // Fetch all broadcasts
    const response = await youtube.liveBroadcasts.list({
      auth: oauth2Client,
      part: "id,snippet",
      broadcastStatus: "active", // Get only currently live streams
      broadcastType: "all",
    });
    const liveBroadcasts = response.data.items.filter(broadcast => {
      return broadcast.snippet.channelId === req.session.channelId; // Ensure you store the user's channel ID during authentication
    });

    if (liveBroadcasts.length === 0) {
      return res.status(404).json({ error: "No active live stream found" });
    }

    const liveVideoId = liveBroadcasts[0].id; // Get the live video ID
    res.json({ liveVideoId });
  } catch (error) {
    console.error("Error fetching live video:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/check-live-status/:broadcastId", async (req, res) => {
  try {
      if (!req.session.tokens) {
          return res.status(401).json({ error: "User not authenticated" });
      }
      oauth2Client.setCredentials(req.session.tokens);
      const youtube = google.youtube("v3");

      // Get live stream details
      const response = await youtube.liveBroadcasts.list({
          auth: oauth2Client,
          part: "snippet,status",
          id: req.params.broadcastId,
      });

      const broadcast = response.data.items[0];
      if (!broadcast) {
          return res.status(404).json({ error: "Broadcast not found" });
      }

      const status = broadcast.status.lifeCycleStatus; // Possible values: "live", "completed", "upcoming"
      res.json({ status });

  } catch (error) {
      console.error("Error checking live status:", error);
      res.status(500).json({ error: error.message });
  }
});


// WebSocket
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("join", (roomId) => {
    socket.join(roomId);
  });

  socket.on("send_message", (message) => {
    socket.to(message.roomId).emit("receive_message", message);
  });
  
  // socket.on("joinLiveChat", ({ liveVideoId }) => {
  //   socket.join(liveVideoId);
  // });

  // socket.on("sendMessage", async ({ liveVideoId, userId, message }) => {
  //   io.to(liveVideoId).emit("receiveMessage", { userId, message, fromYouTube: false });

  //   // Optional: Send message to YouTube Live Chat (if user is authenticated)
  //   if (socket.request.session) {
  //     try {
  //       const youtube = google.youtube("v3");
  //       await youtube.liveChatMessages.insert({
  //         auth: oauth2Client,
  //         part: "snippet",
  //         requestBody: {
  //           snippet: {
  //             liveChatId: socket.request.liveChatId,
  //             type: "textMessageEvent",
  //             textMessageDetails: { messageText: message },
  //           },
  //         },
  //       });
  //     } catch (error) {
  //       console.error("Error sending message to YouTube:", error);
  //     }
  //   }
  // });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Server Setup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
