import { useState } from "react";
import ManagerTabs from "./ManagerTabs";

export default function PasswordManagement() {
  const roles = ["Manager", "Reception", "Gate"];
  const [selectedRole, setSelectedRole] = useState("Manager");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset password states
  const [showResetModal, setShowResetModal] = useState(false);
  const [showForgotSection, setShowForgotSection] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [resetRole, setResetRole] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Handle change password with old password verification
  const handleChangePassword = async () => {
    setMessage(null);
    setLoading(true);

    try {
      // Validation
      if (!oldPassword || !newPassword || !confirmPassword) {
        setMessage({ type: "error", text: "All fields are required." });
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setMessage({ type: "error", text: "New password must be at least 6 characters." });
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setMessage({ type: "error", text: "New password and confirm password do not match." });
        setLoading(false);
        return;
      }

      // Call API to change password
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to change password" });
        setLoading(false);
        return;
      }

      setMessage({ type: "success", text: `${selectedRole} password updated successfully!` });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage({ type: "error", text: "Failed to change password. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Open reset password modal
  const openResetModal = async (role) => {
    console.log("Opening reset modal for role:", role);
    try {
      // Fetch security question
      const response = await fetch(`${API_BASE}/auth/security-question`);
      const data = await response.json();
      
      console.log("Security question response:", data);
      
      if (response.ok) {
        setSecurityQuestion(data.question);
        setResetRole(role);
        setShowResetModal(true);
        setSecurityAnswer("");
        setResetNewPassword("");
        setResetConfirmPassword("");
        setMessage(null);
      } else {
        console.error("Failed to fetch security question:", data);
        setMessage({ type: "error", text: data.error || "Failed to load security question" });
      }
    } catch (error) {
      console.error("Error fetching security question:", error);
      setMessage({ type: "error", text: "Failed to load security question" });
    }
  };

  // Handle reset password with security question verification
  const handleResetPassword = async () => {
    console.log("Reset password called with:", {
      resetRole,
      securityAnswer,
      resetNewPassword,
      resetConfirmPassword
    });
    
    setMessage(null);
    setLoading(true);

    try {
      // Validation
      if (!securityAnswer || !resetNewPassword || !resetConfirmPassword) {
        setMessage({ type: "error", text: "All fields are required." });
        setLoading(false);
        return;
      }

      if (resetNewPassword.length < 6) {
        setMessage({ type: "error", text: "New password must be at least 6 characters." });
        setLoading(false);
        return;
      }

      if (resetNewPassword !== resetConfirmPassword) {
        setMessage({ type: "error", text: "New password and confirm password do not match." });
        setLoading(false);
        return;
      }

      console.log("Sending reset password request to:", `${API_BASE}/auth/reset-password`);

      // Call API to reset password
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: resetRole,
          newPassword: resetNewPassword,
          securityAnswer,
        }),
      });

      const data = await response.json();
      
      console.log("Reset password response:", { status: response.status, data });

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to reset password" });
        setLoading(false);
        return;
      }

      setMessage({ type: "success", text: `${resetRole} password reset successfully!` });
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        setShowResetModal(false);
        setSecurityAnswer("");
        setResetNewPassword("");
        setResetConfirmPassword("");
      }, 2000);
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage({ type: "error", text: "Failed to reset password. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Password Management</h1>

      {/* ✅ TOGGLE BUTTONS */}
      <ManagerTabs />

      <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg p-6 mt-6">
        {message && (
          <div
            className={`p-3 mb-4 rounded border ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-red-100 text-red-800 border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* Role Selection */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Select Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Old Password */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder={`Enter old password for ${selectedRole}`}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          {/* Button to show/hide forgot password section */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowForgotSection(!showForgotSection)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2"
            >
              <span>🔐</span>
              <span>{showForgotSection ? "Hide" : "Reset Using Security Question"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Password Reset Section - For Forgotten Passwords */}
      {showForgotSection && (
        <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg p-6 mt-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">🔐 Forgot Password? Reset Without Old Password</h2>
        <p className="text-sm text-gray-600 mb-4">
          If you don't know the old password for any role, you can reset it by answering the security question.
        </p>

        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
              <span className="font-semibold text-gray-700">{role}</span>
              <button
                type="button"
                onClick={() => openResetModal(role)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1.5 px-4 rounded-md transition duration-200 text-sm"
              >
                Reset Password
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> You will need to answer the security question to reset any password.
          </p>
        </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Reset Password for {resetRole}
            </h2>

            {message && (
              <div
                className={`p-3 mb-4 rounded border ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-red-100 text-red-800 border-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Security Question */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">
                  Security Question
                </label>
                <p className="text-gray-800 bg-gray-100 p-2 rounded border">
                  {securityQuestion}
                </p>
              </div>

              {/* Security Answer */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setMessage(null);
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
