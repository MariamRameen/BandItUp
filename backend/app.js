// backend/app.js - Updated
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const adminRoutes = require('./routes/admin');
const writingRoutes = require('./routes/writing');

const app = express();



app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());


app.use("/avatars", express.static(path.join(__dirname, "uploads/avatars")));


mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/writing', writingRoutes); 

app.listen(process.env.PORT, () =>
  console.log("Backend running on port", process.env.PORT)
);