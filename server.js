// server.js
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// If you are using Node <18, uncomment below line
// import fetch from "node-fetch";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 🔒 Keep secrets server-side only
const API_BASE = "https://xwalletbot.shop/number.php";
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("\n❌ Missing API_KEY. Create a .env file with: API_KEY=your_key_here\n");
  process.exit(1);
}

// Serve static files (frontend inside /public)
app.use(express.static(path.join(__dirname, "public")));

// Validator
function isTenDigitNumber(v) {
  return /^[0-9]{10}$/.test(String(v || "").trim());
}

// Proxy route
app.get("/api/lookup", async (req, res) => {
  try {
    const number = String(req.query.number || "").trim();
    if (!isTenDigitNumber(number)) {
      return res.status(400).json({ status: "error", message: "Invalid mobile number" });
    }

    const url = `${API_BASE}?key=${encodeURIComponent(API_KEY)}&number=${encodeURIComponent(number)}`;
    const apiRes = await fetch(url, { method: "GET" });
    const text = await apiRes.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(502).json({ status: "error", message: "Upstream returned non-JSON" });
    }

    if (!apiRes.ok) {
      return res.status(apiRes.status).json(data);
    }

    return res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
  console.log(`📄 Open http://localhost:${PORT} in your browser.\n`);
});
