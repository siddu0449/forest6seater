const bcrypt = require("bcryptjs");
const UserCredential = require("../models/UserCredential");
const SecurityQuestion = require("../models/SecurityQuestion");

// Initialize default passwords and security question
const initializeCredentials = async () => {
  try {
    const saltRounds = 10;

    // Initialize user credentials
    const defaultCredentials = [
      { role: "MANAGER", password: "manager@123" },
      { role: "RECEPTION", password: "reception@123" },
      { role: "GATE", password: "gate@123" },
    ];

    for (const cred of defaultCredentials) {
      const existing = await UserCredential.findOne({
        where: { role: cred.role },
      });

      if (!existing) {
        const hashedPassword = await bcrypt.hash(cred.password, saltRounds);
        await UserCredential.create({
          role: cred.role,
          password: hashedPassword,
        });
        console.log(`✅ Created ${cred.role} credential`);
      }
    }

    // Initialize security question
    const existingQuestion = await SecurityQuestion.findOne();
    if (!existingQuestion) {
      const hashedAnswer = await bcrypt.hash("9686", saltRounds);
      await SecurityQuestion.create({
        question: "What is the code for forest",
        answer: hashedAnswer,
      });
      console.log("✅ Created security question");
    }

    console.log("✅ Credentials initialization complete");
  } catch (error) {
    console.error("❌ Error initializing credentials:", error);
  }
};

// Login
const login = async (req, res) => {
  try {
    const { role, password } = req.body;

    if (!role || !password) {
      return res.status(400).json({ error: "Role and password are required" });
    }

    const user = await UserCredential.findOne({
      where: { role: role.toUpperCase() },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

// Get security question
const getSecurityQuestion = async (req, res) => {
  try {
    const question = await SecurityQuestion.findOne();
    if (!question) {
      return res.status(404).json({ error: "Security question not found" });
    }

    res.json({ question: question.question });
  } catch (error) {
    console.error("Error fetching security question:", error);
    res.status(500).json({ error: "Failed to fetch security question" });
  }
};

// Verify security answer
const verifySecurityAnswer = async (req, res) => {
  try {
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({ error: "Answer is required" });
    }

    const question = await SecurityQuestion.findOne();
    if (!question) {
      return res.status(404).json({ error: "Security question not found" });
    }

    const isAnswerValid = await bcrypt.compare(answer, question.answer);

    if (!isAnswerValid) {
      return res.status(401).json({ error: "Incorrect answer" });
    }

    res.json({ message: "Answer verified", verified: true });
  } catch (error) {
    console.error("Error verifying answer:", error);
    res.status(500).json({ error: "Verification failed" });
  }
};

// Change password (requires old password verification)
const changePassword = async (req, res) => {
  try {
    const { role, oldPassword, newPassword } = req.body;

    if (!role || !oldPassword || !newPassword) {
      return res.status(400).json({
        error: "Role, old password, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    const user = await UserCredential.findOne({
      where: { role: role.toUpperCase() },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordValid) {
      return res.status(401).json({ error: "Old password is incorrect" });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await user.update({ password: hashedNewPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// Reset password (requires security question verification)
const resetPassword = async (req, res) => {
  try {
    const { role, newPassword, securityAnswer } = req.body;

    if (!role || !newPassword || !securityAnswer) {
      return res.status(400).json({
        error: "Role, new password, and security answer are required",
      });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    // Verify security answer
    const question = await SecurityQuestion.findOne();
    if (!question) {
      return res.status(404).json({ error: "Security question not found" });
    }

    const isAnswerValid = await bcrypt.compare(securityAnswer, question.answer);

    if (!isAnswerValid) {
      return res.status(401).json({ error: "Incorrect security answer" });
    }

    // Update password
    const user = await UserCredential.findOne({
      where: { role: role.toUpperCase() },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await user.update({ password: hashedNewPassword });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

module.exports = {
  initializeCredentials,
  login,
  getSecurityQuestion,
  verifySecurityAnswer,
  changePassword,
  resetPassword,
};
