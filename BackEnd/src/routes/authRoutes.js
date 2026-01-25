const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Login route
router.post("/login", authController.login);

// Get security question
router.get("/security-question", authController.getSecurityQuestion);

// Verify security answer
router.post("/verify-security-answer", authController.verifySecurityAnswer);

// Change password (with old password verification)
router.post("/change-password", authController.changePassword);

// Reset password (with security question verification)
router.post("/reset-password", authController.resetPassword);

module.exports = router;
