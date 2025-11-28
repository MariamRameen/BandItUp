require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

const app = express();

app.use(express.json());

app.use(cookieParser());
app.use("/uploads", express.static("uploads"));


app.use(
  cors({
    origin: "http://localhost:5173",  
    credentials: true, 
  })
);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

app.listen(process.env.PORT, () =>
  console.log("Backend running on port", process.env.PORT)
);
