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
const readingRoutes = require('./routes/reading');
const chatRoutes = require('./routes/chatRoutes');
const vocabRoutes = require('./routes/vocab');
const listeningRoutes = require("./routes/listening");

const app = express();


app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/vocab', vocabRoutes);
app.use("/avatars", express.static(path.join(__dirname, "uploads/avatars")));

app.use("/api/baseline", require("./routes/baseline"));
app.use("/api/listening", listeningRoutes);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));


app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/writing', writingRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/chat', chatRoutes);


app.get("/", (req, res) => res.send("BandItUp Backend Running"));


app.listen(process.env.PORT, () =>
  console.log("Backend running on port", process.env.PORT)
);