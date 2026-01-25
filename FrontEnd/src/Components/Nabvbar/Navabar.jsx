import { useNavigate } from "react-router-dom";
import { isLoggedIn, logout } from "../../utils/auth";
import forestLogo from "../Images/Forest Logo.png";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="bg-green-700 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between shadow-md flex-wrap">
      
      {/* Left side: Logo + Text */}
      <div className="flex items-center flex-shrink-0">
  <img
    src={forestLogo}
    alt="Forest Logo"
    className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain mr-2 sm:mr-3"
  />
  <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold">
    PHANSOLI RESERVE
  </h1>
</div>


      {/* Right side: Login/Logout */}
      <div className="flex items-center flex-shrink-0 ml-2">
        {isLoggedIn() ? (
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="bg-red-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-base hover:bg-red-600 transition"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="bg-white text-green-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded font-semibold text-sm sm:text-base hover:bg-green-100 transition"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
