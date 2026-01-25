import { useState } from "react";
import ManagerTabs from "./ManagerTabs";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ReportsAnalytics() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState("all"); // "all", "paid", "unpaid"

  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both From and To dates");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError("From date cannot be after To date");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/bookings/report?fromDate=${fromDate}&toDate=${toDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Report Data:', data.data);
        setReportData(data.data);
      } else {
        setError(data.message || 'Failed to fetch report');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!reportData) return;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary worksheet data
    const summaryData = [
      ["Safari Visitor Report"],
      [""],
      ["Report Period", `${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`],
      [""],
      ["Summary Statistics"],
      ["Total Visitors", reportData.totalVisitors],
      ["Paid Bookings", reportData.paymentsCompleted],
      ["Pending Bookings", reportData.paymentsPending],
      ["Total Seats Booked", reportData.totalSeats],
      ["Total Adults", reportData.totalAdults || 0],
      ["Total Children", reportData.totalChildren || 0],
      ["Total Collection (₹)", reportData.totalPayments],
      [""],
      ["Payment Breakdown"],
      ["Payments Completed", reportData.paymentsCompleted],
      ["Payments Pending", reportData.paymentsPending],
      ["Unpaid/Deleted Bookings", reportData.unpaidBookings?.length || 0],
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, "Report Summary");

    // Detailed bookings worksheet
    if (reportData.bookings && reportData.bookings.length > 0) {
      const bookingsData = [
        ["Detailed Visitor Bookings"],
        [""],
        ["Token", "Name", "Phone", "Email", "Safari Date", "Time Slot", "Adults", "Children", "Total Seats", "Payment Status", "Payment Mode", "UTR Number", "Amount (₹)"]
      ];

      reportData.bookings.forEach(booking => {
        bookingsData.push([
          booking.token,
          booking.name,
          booking.phone,
          booking.email,
          new Date(booking.safariDate).toLocaleDateString(),
          booking.timeSlot,
          booking.adults,
          booking.children,
          booking.totalSeats,
          booking.paymentDone ? "Paid" : "Pending",
          booking.paymentMode || "-",
          booking.utrNumber || "-",
          booking.paymentAmount || 0
        ]);
      });

      const wsBookings = XLSX.utils.aoa_to_sheet(bookingsData);
      wsBookings['!cols'] = [
        { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 12 },
        { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 15 },
        { wch: 15 }, { wch: 20 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, wsBookings, "All Bookings");
    }

    // Unpaid bookings worksheet
    if (reportData.unpaidBookings && reportData.unpaidBookings.length > 0) {
      const unpaidData = [
        ["Unpaid/Deleted Bookings - Payment Timeout"],
        [""],
        ["Token", "Name", "Phone", "Email", "Safari Date", "Time Slot", "Adults", "Children", "Total Seats", "Amount (₹)", "Deleted At", "Reason"]
      ];

      reportData.unpaidBookings.forEach(booking => {
        unpaidData.push([
          booking.token,
          booking.name,
          booking.phone,
          booking.email,
          new Date(booking.safariDate).toLocaleDateString(),
          booking.timeSlot,
          booking.adults,
          booking.children,
          booking.totalSeats,
          booking.totalAmount,
          new Date(booking.deletedAt).toLocaleString(),
          booking.reason
        ]);
      });

      const wsUnpaid = XLSX.utils.aoa_to_sheet(unpaidData);
      wsUnpaid['!cols'] = [
        { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 12 },
        { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
        { wch: 20 }, { wch: 35 }
      ];
      XLSX.utils.book_append_sheet(wb, wsUnpaid, "Unpaid Bookings");
    }

    // Generate filename with date range
    const filename = `Safari_Report_${fromDate}_to_${toDate}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-green-800 mb-6">📊 Reports & Analytics</h2>
<ManagerTabs />
      {/* Date Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Select Date Range</h3>
        
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="space-y-6">
          {/* Download Button */}
          <div className="flex justify-end">
            <button
              onClick={downloadExcel}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition flex items-center gap-2"
            >
              <span>📥</span>
              Download Excel Report
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <SummaryCard title="Visitors Token" value={reportData.totalVisitors} />
            <SummaryCard title="Paid" value={reportData.paymentsCompleted} color="green" />
            <SummaryCard title="Unpaid (Deleted)" value={reportData.unpaidBookings?.length || 0} color="red" />
            <SummaryCard title="Total Seats" value={reportData.totalSeats} />
            <SummaryCard
              title="Total Collection"
              value={`₹${reportData.totalPayments.toLocaleString()}`}
              color="blue"
            />
          </div>

          {/* Time Slot Breakdown */}
          {reportData.slotData && Object.keys(reportData.slotData).length > 0 && (
            <div className="mb-6 bg-white rounded shadow p-4">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Time Slot Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(reportData.slotData).map(([slot, data]) => (
                  <div key={slot} className="border rounded p-3">
                    <p className="font-semibold text-blue-700">{slot}</p>
                    <p className="text-sm text-gray-600">Bookings: <span className="font-bold">{data.count}</span></p>
                    <p className="text-sm text-gray-600">Seats: <span className="font-bold">{data.seats}</span></p>
                    <p className="text-sm text-gray-600">Revenue: <span className="font-bold">₹{data.amount.toLocaleString()}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Bookings Table */}
          {(reportData.bookings?.length > 0 || reportData.unpaidBookings?.length > 0) && (
            <div className="mb-6 bg-white rounded shadow">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800">Detailed Bookings</h3>
                  
                  {/* Filter Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentFilter("all")}
                      className={`px-4 py-2 rounded font-semibold transition ${
                        paymentFilter === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      All Records
                    </button>
                    <button
                      onClick={() => setPaymentFilter("paid")}
                      className={`px-4 py-2 rounded font-semibold transition ${
                        paymentFilter === "paid"
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Paid Only
                    </button>
                    <button
                      onClick={() => setPaymentFilter("unpaid")}
                      className={`px-4 py-2 rounded font-semibold transition ${
                        paymentFilter === "unpaid"
                          ? "bg-red-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Unpaid (Deleted)
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 border">Token</th>
                      <th className="p-2 border">Name</th>
                      <th className="p-2 border">Phone</th>
                      <th className="p-2 border">Safari Date</th>
                      <th className="p-2 border">Time Slot</th>
                      <th className="p-2 border">Seats</th>
                      <th className="p-2 border">Status</th>
                      <th className="p-2 border">Mode</th>
                      <th className="p-2 border">UTR</th>
                      <th className="p-2 border">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentFilter === "paid" && reportData.bookings
                      ?.filter((booking) => booking.paymentDone === true)
                      .map((booking) => (
                        <tr key={booking.id} className="text-center hover:bg-gray-50">
                          <td className="p-2 border font-bold text-blue-700">
                            {booking.token}
                          </td>
                          <td className="p-2 border">{booking.name}</td>
                          <td className="p-2 border">{booking.phone}</td>
                          <td className="p-2 border">{new Date(booking.safariDate).toLocaleDateString()}</td>
                          <td className="p-2 border">{booking.timeSlot}</td>
                          <td className="p-2 border">{booking.totalSeats || 0}</td>
                          <td className="p-2 border">
                            <span className="text-green-700 font-semibold">Paid</span>
                          </td>
                          <td className="p-2 border">{booking.paymentMode || "-"}</td>
                          <td className="p-2 border text-xs">{booking.utrNumber || "-"}</td>
                          <td className="p-2 border">
                            {booking.paymentAmount
                              ? `₹${parseFloat(booking.paymentAmount).toLocaleString()}`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    
                    {paymentFilter === "unpaid" && reportData.unpaidBookings
                      ?.map((booking, index) => (
                        <tr key={`unpaid-${index}`} className="text-center hover:bg-red-50">
                          <td className="p-2 border font-bold text-blue-700">
                            {booking.token}
                          </td>
                          <td className="p-2 border">{booking.name}</td>
                          <td className="p-2 border">{booking.phone}</td>
                          <td className="p-2 border">{new Date(booking.safariDate).toLocaleDateString()}</td>
                          <td className="p-2 border">{booking.timeSlot}</td>
                          <td className="p-2 border">{booking.totalSeats || 0}</td>
                          <td className="p-2 border">
                            <span className="text-red-700 font-semibold">Unpaid (Deleted)</span>
                          </td>
                          <td className="p-2 border">-</td>
                          <td className="p-2 border text-xs">-</td>
                          <td className="p-2 border">
                            {booking.totalAmount
                              ? `₹${parseFloat(booking.totalAmount).toLocaleString()}`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    
                    {paymentFilter === "all" && (
                      <>
                        {reportData.bookings
                          ?.filter((booking) => booking.paymentDone === true)
                          .map((booking) => (
                            <tr key={booking.id} className="text-center hover:bg-gray-50">
                              <td className="p-2 border font-bold text-blue-700">
                                {booking.token}
                              </td>
                              <td className="p-2 border">{booking.name}</td>
                              <td className="p-2 border">{booking.phone}</td>
                              <td className="p-2 border">{new Date(booking.safariDate).toLocaleDateString()}</td>
                              <td className="p-2 border">{booking.timeSlot}</td>
                              <td className="p-2 border">{booking.totalSeats || 0}</td>
                              <td className="p-2 border">
                                <span className="text-green-700 font-semibold">Paid</span>
                              </td>
                              <td className="p-2 border">{booking.paymentMode || "-"}</td>
                              <td className="p-2 border text-xs">{booking.utrNumber || "-"}</td>
                              <td className="p-2 border">
                                {booking.paymentAmount
                                  ? `₹${parseFloat(booking.paymentAmount).toLocaleString()}`
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        {reportData.unpaidBookings
                          ?.map((booking, index) => (
                            <tr key={`unpaid-${index}`} className="text-center hover:bg-red-50">
                              <td className="p-2 border font-bold text-blue-700">
                                {booking.token}
                              </td>
                              <td className="p-2 border">{booking.name}</td>
                              <td className="p-2 border">{booking.phone}</td>
                              <td className="p-2 border">{new Date(booking.safariDate).toLocaleDateString()}</td>
                              <td className="p-2 border">{booking.timeSlot}</td>
                              <td className="p-2 border">{booking.totalSeats || 0}</td>
                              <td className="p-2 border">
                                <span className="text-red-700 font-semibold">Unpaid (Deleted)</span>
                              </td>
                              <td className="p-2 border">-</td>
                              <td className="p-2 border text-xs">-</td>
                              <td className="p-2 border">
                                {booking.totalAmount
                                  ? `₹${parseFloat(booking.totalAmount).toLocaleString()}`
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Additional Details - Payment Status */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Payments Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{reportData.paymentsCompleted}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Unpaid Bookings (Deleted)</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{reportData.unpaidBookings?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Date Range Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Report Period:</strong> {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}
            </p>
          </div>

          {/* Unpaid/Deleted Bookings Section */}
          {reportData.unpaidBookings && reportData.unpaidBookings.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-700">
                  🚫 Unpaid Bookings - Payment Timeout (15 min)
                </h3>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {reportData.unpaidBookings.length} Deleted
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                These bookings were automatically deleted because payment was not completed within 15 minutes.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-red-50 border-b border-red-200">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Token</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Safari Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Time Slot</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Seats</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Deleted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.unpaidBookings.map((booking, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-blue-600">#{booking.token}</td>
                        <td className="px-4 py-3">{booking.name}</td>
                        <td className="px-4 py-3 text-xs">{booking.email}</td>
                        <td className="px-4 py-3">{booking.phone}</td>
                        <td className="px-4 py-3">{new Date(booking.safariDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-xs">{booking.timeSlot}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {booking.totalSeats} ({booking.adults}A + {booking.children}C)
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-red-600">₹{booking.totalAmount}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {new Date(booking.deletedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> These visitors did not complete payment within the 15-minute window. 
                  Their bookings were automatically removed to free up slots for other visitors.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!reportData && !loading && !error && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📈</div>
          <p className="text-gray-600">Select a date range and click "Generate Report" to view analytics</p>
        </div>
      )}
    </div>
  );
}

/* Summary Card Component */
function SummaryCard({ title, value, color = "gray" }) {
  const colors = {
    gray: "bg-gray-200 text-gray-800",
    green: "bg-green-200 text-green-800",
    red: "bg-red-200 text-red-800",
    blue: "bg-blue-200 text-blue-800",
  };

  return (
    <div className={`p-4 rounded shadow ${colors[color]}`}>
      <p className="text-sm">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
