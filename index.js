import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const app = express();
app.use(express.json());

// ค่าเหล่านี้จะดึงมาจาก Environment Variables ที่เราจะตั้งในขั้นตอนถัดไป
const GEMINI_API_KEY = process.env.GEMINI_KEY;
const LINE_ACCESS_TOKEN = process.env.LINE_TOKEN;

// ตั้งค่า AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.send("สวัสดี! บอททำงานอยู่ครับ (LINE Chatbot with Gemini)");
});

app.post("/webhook", async (req, res) => {
  try {
    const events = req.body.events;
    if (!events || events.length === 0) {
      return res.status(200).send("OK");
    }

    // วนลูปตอบทุกข้อความที่ส่งเข้ามา
    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        console.log(`User sent: ${userMessage}`);

        // 1. ส่งข้อความไปถาม Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const textReply = response.text();

        // 2. ส่งคำตอบกลับไปที่ LINE
        await replyToLine(replyToken, textReply);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error");
  }
});

// ฟังก์ชันส่งข้อความกลับ LINE
async function replyToLine(replyToken, text) {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
  };

  const body = {
    replyToken: replyToken,
    messages: [{ type: "text", text: text }],
  };

  await axios.post("https://api.line.me/v2/bot/message/reply", body, { headers });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
