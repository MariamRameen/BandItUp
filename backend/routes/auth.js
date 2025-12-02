const express = require("express");
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getMe,
  verifyEmail,          
  resendVerificationEmail 
} = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail); 
router.post("/resend-verification", resendVerificationEmail);
router.get("/me", auth, getMe);

module.exports = router;