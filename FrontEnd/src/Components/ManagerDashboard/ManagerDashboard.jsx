import { useEffect, useMemo, useState } from "react";
import ManagerTabs from "./ManagerTabs";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ManagerDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [recordLogs, setRecordLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  /* -------------------- FETCH DATA -------------------- */
  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [bookingsRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/bookings?safariDate=${selectedDate}`),
        fetch(`${API_URL}/record-logs?date=${selectedDate}`),
      ]);

      const bookingsData = await bookingsRes.json();
      const logsData = await logsRes.json();

      if (bookingsData.success) {
        setVisitors(bookingsData.data);
      } else {
        setVisitors([]);
      }

      if (logsData.success) {
        setRecordLogs(logsData.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- TOKEN → VEHICLE MAP -------------------- */
  const tokenVehicleMap = useMemo(() => {
    const map = {};

    // logs are already DESC from backend
    recordLogs.forEach((log) => {
      if (!map[log.token]) {
        map[log.token] = {
          vehicleNumber: log.vehicleNumber,
          driverName: log.driverName,
        };
      }
    });

    return map;
  }, [recordLogs]);

  /* -------------------- DATE VISITORS -------------------- */
  const dateVisitors = useMemo(() => {
    const filtered = visitors.filter(
      (v) => v.safariDate === selectedDate
    );

    // token DESCENDING
    filtered.sort((a, b) => Number(b.token) - Number(a.token));

    return filtered.map((visitor) => {
      const logInfo = tokenVehicleMap[visitor.token];

      return {
        ...visitor,
        vehicleNumber: logInfo?.vehicleNumber || "-",
        driverName: logInfo?.driverName || "-",
      };
    });
  }, [visitors, selectedDate, tokenVehicleMap]);

  /* -------------------- SUMMARY -------------------- */
  const summary = useMemo(() => {
    const totalVisitors = dateVisitors.length;
    const paid = dateVisitors.filter((v) => v.paymentDone).length;
    const pending = totalVisitors - paid;

    const totalSeats = dateVisitors
      .filter((v) => v.paymentDone)
      .reduce((sum, v) => sum + (parseInt(v.totalSeats) || 0), 0);

    const paidAmount = dateVisitors
      .filter((v) => v.paymentDone)
      .reduce((sum, v) => sum + (parseFloat(v.paymentAmount) || 0), 0);

    return {
      totalVisitors,
      paid,
      pending,
      totalSeats,
      paidAmount,
    };
  }, [dateVisitors]);

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Manager Dashboard</h1>

      <ManagerTabs />

      {/* Date selector */}
      <div className="flex gap-3 items-center mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <SummaryCard title="Visitors" value={summary.totalVisitors} />
        <SummaryCard title="Paid" value={summary.paid} color="green" />
        <SummaryCard title="Pending" value={summary.pending} color="red" />
        <SummaryCard title="Seats" value={summary.totalSeats} />
        <SummaryCard
          title="Collection"
          value={`₹${summary.paidAmount.toLocaleString()}`}
          color="blue"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow max-h-[60vh] overflow-y-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              <th className="p-2 border">Token</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Time Slot</th>
              <th className="p-2 border">Seats</th>
              <th className="p-2 border">Vehicle</th>
              <th className="p-2 border">Driver</th>
              <th className="p-2 border">Payment</th>
              <th className="p-2 border">Amount</th>
            </tr>
          </thead>

          <tbody>
            {dateVisitors.map((v) => (
              <tr key={v.id} className="text-center">
                <td className="p-2 border font-bold text-blue-700">
                  {v.token}
                </td>
                <td className="p-2 border">{v.name}</td>
                <td className="p-2 border">{v.phone}</td>
                <td className="p-2 border">{v.timeSlot}</td>
                <td className="p-2 border">{v.totalSeats || 0}</td>
                <td className="p-2 border font-semibold text-indigo-700">
                  {v.vehicleNumber}
                </td>
                <td className="p-2 border font-semibold text-purple-700">
                  {v.driverName}
                </td>
                <td className="p-2 border">
                  {v.paymentDone ? (
                    <span className="text-green-600 font-semibold">
                      Paid
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      Pending
                    </span>
                  )}
                </td>
                <td className="p-2 border">
                  {v.paymentAmount
                    ? `₹${parseFloat(v.paymentAmount).toLocaleString()}`
                    : "-"}
                </td>
              </tr>
            ))}

            {!loading && dateVisitors.length === 0 && (
              <tr>
                <td
                  colSpan="9"
                  className="p-4 text-center text-gray-500"
                >
                  No data for selected date
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------- SUMMARY CARD -------------------- */
function SummaryCard({ title, value, color = "gray" }) {
  const colors = {
    gray: "bg-gray-200",
    green: "bg-green-200",
    red: "bg-red-200",
    blue: "bg-blue-200",
  };

  return (
    <div className={`p-4 rounded shadow ${colors[color]}`}>
      <p className="text-sm">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
