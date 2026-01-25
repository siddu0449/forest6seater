import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../constants/roles";
import bgLogin from "../Images/Bg Login.png";

export default function Login() {
  const roles = ["MANAGER", "RECEPTION", "GATE"];
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);

  // Reset password states
  const [showForgotSection, setShowForgotSection] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [resetRole, setResetRole] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password || !role) {
      setError("Please fill all fields");
      setLoading(false);
      return;
    }

    try {
      // Call backend API for authentication
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Store login info
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", role);
      localStorage.setItem("username", username);

      // Navigate based on role
      switch (role) {
        case ROLES.RECEPTION:
          navigate("/reception");
          break;
        case ROLES.MANAGER:
          navigate("/manager");
          break;
        case ROLES.GATE:
          navigate("/gate");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Open reset password modal
  const openResetModal = async (selectedRole) => {
    console.log("Opening reset modal for role:", selectedRole);
    try {
      const response = await fetch(`${API_BASE}/auth/security-question`);
      const data = await response.json();
      
      console.log("Security question response:", data);
      
      if (response.ok) {
        setSecurityQuestion(data.question);
        setResetRole(selectedRole);
        setShowResetModal(true);
        setSecurityAnswer("");
        setResetNewPassword("");
        setResetConfirmPassword("");
        setMessage(null);
        setError("");
      } else {
        console.error("Failed to fetch security question:", data);
        setMessage({ type: "error", text: data.error || "Failed to load security question" });
      }
    } catch (error) {
      console.error("Error fetching security question:", error);
      setMessage({ type: "error", text: "Failed to load security question" });
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    console.log("Reset password called with:", {
      resetRole,
      securityAnswer,
      resetNewPassword,
      resetConfirmPassword
    });
    
    setMessage(null);
    setError("");
    setLoading(true);

    try {
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
      
      setTimeout(() => {
        setShowResetModal(false);
        setSecurityAnswer("");
        setResetNewPassword("");
        setResetConfirmPassword("");
        setMessage(null);
      }, 2000);
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage({ type: "error", text: "Failed to reset password. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url(${bgLogin})` }}
      ></div>

      <form
        className="relative z-10 bg-white bg-opacity-90 p-6 rounded shadow-md w-full max-w-sm"
        onSubmit={handleLogin}
      >
        <h2 className="text-xl font-bold mb-4 text-green-800 text-center">
          Forest Department Login
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
            {error}
          </div>
        )}

        {/* Role */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="">Select Role</option>
          <option value={ROLES.MANAGER}>Manager</option>
          <option value={ROLES.RECEPTION}>Reception</option>
          <option value={ROLES.GATE}>Gate</option>
        </select>

        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        />

        {/* Login */}
        <button 
          className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Forgot Password Link */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => {
              setShowForgotSection(!showForgotSection);
              setShowResetModal(false);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-semibold"
          >
            {showForgotSection ? "Hide Password Reset Options" : "Forgot Password? Reset with Security Question"}
          </button>
        </div>
      </form>

      {/* Password Reset Section - For Forgotten Passwords */}
      {showForgotSection && (
        <div className="relative z-10 bg-white bg-opacity-95 p-6 rounded shadow-lg w-full max-w-md mt-4">
          <h2 className="text-lg font-bold mb-3 text-gray-800">🔐 Forgot Password? Reset Without Old Password</h2>
          <p className="text-xs text-gray-600 mb-4">
            If you don't know the old password for any role, you can reset it by answering the security question.
          </p>

          <div className="flex flex-col space-y-3">
            {roles.map((roleName) => (
              <div key={roleName} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                <span className="font-semibold text-gray-700">{roleName.charAt(0) + roleName.slice(1).toLowerCase()}</span>
                <button
                  type="button"
                  onClick={() => openResetModal(roleName)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-[10000]" style={{ zIndex: 10000 }}>
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
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
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
                  autoComplete="new-password"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
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
                  autoComplete="new-password"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
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
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
