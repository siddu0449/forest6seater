import { NavLink } from "react-router-dom";

export default function ManagerTabs() {
  const tabClass = ({ isActive }) =>
    `px-4 py-2 rounded font-semibold transition whitespace-nowrap ${
      isActive
        ? "bg-blue-600 text-white"
        : "bg-gray-300 hover:bg-gray-400"
    }`;

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap md:flex-nowrap gap-3 mb-6">
        <NavLink to="/manager/dashboard" className={tabClass}>
          Dashboard
        </NavLink>

        <NavLink to="/manager/manage" className={tabClass}>
          Manage Vehicle & Driver
        </NavLink>

        <NavLink to="/manager/timeslots" className={tabClass}>
          Time Slot Settings
        </NavLink>

        <NavLink to="/manager/reports" className={tabClass}>
          Reports & Analytics
        </NavLink>

        <NavLink to="/manager/password" className={tabClass}>
          Password Management
        </NavLink>
      </div>
    </div>
  );
}
