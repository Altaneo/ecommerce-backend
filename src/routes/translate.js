// backend/routes/translate.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/translate", async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "Text is required" });
    }

    try {
        const response = await axios.post("https://libretranslate.com/translate", {
            q: text,
            source: "en",
            target: "hi",
            format: "text"
        });

        res.json({ translatedText: response.data.translatedText });
    } catch (error) {
        res.status(500).json({ error: "Translation failed", details: error.message });
    }
});

module.exports = router;
