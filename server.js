import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mysql from "mysql2";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();

app.use(cors());
app.use(express.json());

/* ================= DB ================= */
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.getConnection((err, conn) => {
  if (err) {
    console.log("❌ DB Error:", err);
  } else {
    console.log("✅ DB Connected");
    conn.release();
  }
});

/* ================= TEST ================= */
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

/* ================= START ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
});