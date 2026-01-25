import { useEffect, useState, useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ReceptionDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [recordLogs, setRecordLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("reception");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  /* -------------------- LOAD DATA -------------------- */
  useEffect(() => {
    fetchBookings();
    loadVehicles();
    fetchRecordLogs();
  }, [selectedDate]);

  // Fetch available drivers/vehicles after vehicles are loaded
  useEffect(() => {
    if (vehicles.length >= 0) {
      fetchAvailableDrivers();
      fetchAvailableVehicles();
    }
  }, [vehicles, selectedDate]);

  const fetchAvailableDrivers = async () => {
    try {
      const response = await fetch(`${API_URL}/vehicle-driver/drivers/available?date=${selectedDate}`);
      const data = await response.json();
      if (data.success) {
        // Filter out drivers currently on safari
        const driversOnSafari = vehicles
          .filter(v => (v.status === 'moved' || v.safariStatus === 'started') && v.safariStatus !== 'completed')
          .map(v => v.driverName);
        
        const availableDriversList = data.data.filter(driver => 
          !driversOnSafari.includes(driver.name)
        );

        
        
        setAvailableDrivers(availableDriversList);
      }
    } catch (err) {
      console.error('Fetch drivers error:', err);
    }
  };

  const fetchRecordLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/record-logs?date=${selectedDate}`);
      const data = await response.json();
      if (data.success) {
        setRecordLogs(data.data);
      } else {
        setRecordLogs([]);
      }
    } catch (err) {
      console.error('Fetch record logs error:', err);
      setRecordLogs([]);
    }
  };

  const fetchAvailableVehicles = async () => {
    try {
      const response = await fetch(`${API_URL}/vehicle-driver/vehicles/available?date=${selectedDate}`);
      const data = await response.json();
      console.log('📦 Master vehicles from API:', data.data);
      console.log('🚗 Current vehicle assignments:', vehicles);
      
      if (data.success) {
        // Filter out vehicles currently on safari (moved or started, but NOT completed)
        const vehiclesOnSafari = vehicles
          .filter(v => (v.status === 'moved' || v.safariStatus === 'started') && v.safariStatus !== 'completed')
          .map(v => v.vehicleId);
        
        console.log('🔒 Vehicles locked (on safari):', vehiclesOnSafari);
        
        const availableVehiclesList = data.data.filter(vehicle => 
          !vehiclesOnSafari.includes(vehicle.id)
        );
        
        console.log('✅ Available vehicles for dropdown:', availableVehiclesList);
        setAvailableVehicles(availableVehiclesList);
      }
    } catch (err) {
      console.error('Fetch vehicles error:', err);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/bookings?safariDate=${selectedDate}`);
      const data = await response.json();
      
      if (data.success) {
        // Convert backend data to frontend format
        const formattedVisitors = data.data.map(booking => {
          const now = Date.now();
          const timeLeft = booking.expiryTime > now && !booking.paymentDone 
            ? Math.floor((booking.expiryTime - now) / 1000) 
            : 0;
          
          return {
            id: booking.id,
            token: booking.token,
            name: booking.name,
            phone: booking.phone,
            email: booking.email,
            safariDate: booking.safariDate,
            timeSlot: booking.timeSlot,
            adults: booking.adults,
            children: booking.children,
            totalSeats: booking.totalSeats,
            paymentAmount: booking.paymentAmount,
            paymentDone: booking.paymentDone,
            paymentMode: booking.paymentMode || "",
            utrNumber: booking.utrNumber || "",
            expired: booking.expired,
            timeLeft: timeLeft,
            vehicle: booking.vehicle,
            driver: booking.driver,
            safariStatus: booking.safariStatus
          };
        });
        
        setVisitors(formattedVisitors);
        // Also save to localStorage as backup
        localStorage.setItem("visitorList", JSON.stringify(formattedVisitors));
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load bookings');
      // Fallback to localStorage
      const storedVisitors = JSON.parse(localStorage.getItem("visitorList")) || [];
      setVisitors(storedVisitors);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await fetch(`${API_URL}/vehicle-assignments?date=${selectedDate}`);
      const data = await response.json();

      if (data.success) {
        console.log('🔄 Loaded vehicle assignments:', data.data);
        setVehicles(data.data);
        // Also refresh available lists when assignments change
        fetchAvailableDrivers();
        fetchAvailableVehicles();
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error('Load vehicles error:', err);
      setVehicles([]);
    }
  };

  /* -------------------- TIMER (FIXED) -------------------- */
  useEffect(() => {
    const interval = setInterval(async () => {
      setVisitors(prev => {
        const expiredBookings = prev.filter(v => v.timeLeft === 1 && !v.paymentDone);
        
        // Delete expired bookings from database
        expiredBookings.forEach(async (booking) => {
          try {
            await fetch(`${API_URL}/bookings/${booking.id}`, {
              method: 'DELETE'
            });
            console.log(`🗑️ Deleted expired booking: Token #${booking.token}`);
          } catch (error) {
            console.error('Failed to delete expired booking:', error);
          }
        });

        const updated = prev
          .map(v => {
            if (!v.paymentDone && typeof v.timeLeft === "number" && v.timeLeft > 0) {
              return { ...v, timeLeft: v.timeLeft - 1 };
            }
            return v;
          })
          .filter(v => !(v.timeLeft === 0 && !v.paymentDone));

        localStorage.setItem("visitorList", JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* -------------------- FILTER -------------------- */
  const filteredVisitors = useMemo(
    () => visitors.filter(v => v.safariDate === selectedDate),
    [visitors, selectedDate]
  );

  const formatTime = sec => {
    if (typeof sec !== "number" || sec <= 0) return "-";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* -------------------- VEHICLE ASSIGNMENT -------------------- */
  const assignToVehicle = async (visitor, selectedVehicle) => {
    try {
      // First, fetch latest vehicles from database to get accurate count
      const vehiclesResponse = await fetch(`${API_URL}/vehicle-assignments?date=${selectedDate}`);
      const vehiclesData = await vehiclesResponse.json();
      const latestVehicles = vehiclesData.success ? vehiclesData.data : vehicles;
      
      let updated = [...latestVehicles];
      
      // Calculate how many passengers are already assigned to this token across ALL vehicles
      const alreadyAssignedCount = updated
        .flatMap(v => v.passengers || [])
        .filter(p => p.token === visitor.token).length;
      
      const remainingToAssign = visitor.totalSeats - alreadyAssignedCount;
      
      if (remainingToAssign <= 0) {
        alert(`Token #${visitor.token} is already fully assigned!`);
        return;
      }
      
      // Find or create vehicle assignment
      let vehicle = updated.find(v => 
        v.vehicleId === selectedVehicle.id && 
        v.safariDate === selectedDate &&
        (v.status === 'waiting' || v.status === 'ready') // Only reuse waiting/ready vehicles
      );
      
      if (!vehicle) {
        // Create fresh vehicle assignment (or replace completed one)
        vehicle = {
          vehicleId: selectedVehicle.id,
          vehicleNumber: selectedVehicle.number,
          vehicleOwner: selectedVehicle.owner,
          safariDate: selectedDate,
          seatsFilled: 0,
          capacity: selectedVehicle.capacity || 6,
          passengers: [],
          driverName: "",
          status: "waiting",
          safariStatus: "pending"
        };
        updated.push(vehicle);
      }

      // Check available space in this vehicle
      const availableSeats = vehicle.capacity - vehicle.seatsFilled;
      
      if (availableSeats === 0) {
        alert(`Vehicle ${selectedVehicle.number} is full. Please select another vehicle.`);
        return;
      }
      
      // Calculate seats to assign: minimum of (available seats, remaining passengers to assign)
      const seatsToAssignNow = Math.min(availableSeats, remainingToAssign);
      
      // If this assignment will be partial (not all remaining passengers fit)
      if (seatsToAssignNow < remainingToAssign) {
        const confirmPartial = confirm(
          `Vehicle ${selectedVehicle.number} has only ${availableSeats} seats available.\n\n` +
          `Assign ${seatsToAssignNow} people to this vehicle?\n` +
          `(You'll need to assign remaining ${remainingToAssign - seatsToAssignNow} people to another vehicle)`
        );
        
        if (!confirmPartial) return;
      }
      
      // Generate sub-tokens starting from where we left off
      const subTokens = Array.from(
        { length: seatsToAssignNow },
        (_, i) => `${visitor.token}${String.fromCharCode(97 + alreadyAssignedCount + i)}`
      );

      subTokens.forEach(subToken => {
        vehicle.passengers.push({
          subToken,
          token: visitor.token,
          name: visitor.name,
          phone: visitor.phone,
          email: visitor.email
        });
      });

      vehicle.seatsFilled += seatsToAssignNow;
      if (vehicle.seatsFilled === vehicle.capacity) {
        vehicle.status = "ready";
      }

      // Save to database
      await fetch(`${API_URL}/vehicle-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle)
      });
      
      // Reload vehicles from database
      await loadVehicles();
      
      // Calculate new totals
      const newTotalAssigned = alreadyAssignedCount + seatsToAssignNow;
      const newRemaining = visitor.totalSeats - newTotalAssigned;
      const isFullyAssigned = newRemaining <= 0;
      
      // Update visitor status
      const updatedVisitors = visitors.map(v =>
        v.id === visitor.id ? { 
          ...v, 
          vehicleAssigned: isFullyAssigned ? selectedVehicle.number : `Partial`,
          remainingSeats: Math.max(0, newRemaining)
        } : v
      );
      setVisitors(updatedVisitors);
      
      if (!isFullyAssigned) {
        setTimeout(() => {
          alert(`✓ Assigned ${seatsToAssignNow} people to Vehicle ${selectedVehicle.number}\n\n⚠️ Please assign remaining ${newRemaining} people from Token #${visitor.token} to another vehicle.`);
        }, 100);
      }
    } catch (error) {
      console.error('Assign vehicle error:', error);
      alert('Failed to assign vehicle. Please try again.');
    }
  };

  const unassignFromVehicle = async (vehicleIdentifier, token) => {
    try {
      const updated = vehicles.map(v => {
        if (v.vehicleNumber === vehicleIdentifier || v.vehicleId === vehicleIdentifier) {
          const passengers = v.passengers.filter(p => p.token !== token);
          const removedCount = v.passengers.length - passengers.length;
          return {
            ...v,
            passengers,
            seatsFilled: v.seatsFilled - removedCount,
            status: passengers.length === 0 ? "waiting" : v.status
          };
        }
        return v;
      });

      // Update in database
      const vehicleToUpdate = updated.find(v => v.vehicleNumber === vehicleIdentifier || v.vehicleId === vehicleIdentifier);
      if (vehicleToUpdate) {
        await fetch(`${API_URL}/vehicle-assignments/${vehicleToUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vehicleToUpdate)
        });
      }
      
      setVehicles(updated);

      // Update visitor
      const updatedVisitors = visitors.map(v =>
        v.token === token ? { ...v, vehicleAssigned: null, remainingSeats: v.totalSeats } : v
      );
      setVisitors(updatedVisitors);
    } catch (error) {
      console.error('Unassign error:', error);
      alert('Failed to unassign vehicle');
    }
  };

  /* -------------------- PAYMENT -------------------- */
  const markPaymentDone = async (id) => {
    const visitor = visitors.find(v => v.id === id);
    if (!visitor?.paymentMode) return alert("Please select payment mode");

    try {
      const response = await fetch(`${API_URL}/bookings/${id}/confirm-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMode: visitor.paymentMode,
          utrNumber: visitor.utrNumber || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm payment');
      }

      // Update local state
      const updatedVisitors = visitors.map(v =>
        v.id === id ? { ...v, paymentDone: true, timeLeft: null, safariStatus: 'confirmed' } : v
      );

      setVisitors(updatedVisitors);
      localStorage.setItem("visitorList", JSON.stringify(updatedVisitors));

      alert('Payment confirmed successfully! Now assign to a vehicle in Vehicle Dashboard.');
    } catch (err) {
      console.error('Payment confirmation error:', err);
      alert(err.message || 'Failed to confirm payment');
    }
  };

  const setPaymentMode = (id, mode) => {
    const updated = visitors.map(v =>
      v.id === id ? { ...v, paymentMode: mode } : v
    );
    setVisitors(updated);
    localStorage.setItem("visitorList", JSON.stringify(updated));
  };

  const setUtrNumber = (id, utrNumber) => {
    const updated = visitors.map(v =>
      v.id === id ? { ...v, utrNumber } : v
    );
    setVisitors(updated);
    localStorage.setItem("visitorList", JSON.stringify(updated));
  };

  /* -------------------- DRIVER -------------------- */
  const setDriver = async (vehicleIdentifier, driverName) => {
    try {
      const updated = vehicles.map(v =>
        (v.vehicleNumber === vehicleIdentifier || v.vehicleId === vehicleIdentifier) ? { ...v, driverName } : v
      );
      
      const vehicleToUpdate = updated.find(v => v.vehicleNumber === vehicleIdentifier || v.vehicleId === vehicleIdentifier);
      if (vehicleToUpdate && vehicleToUpdate.id) {
        await fetch(`${API_URL}/vehicle-assignments/${vehicleToUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driverName })
        });
      }
      
      setVehicles(updated);
    } catch (error) {
      console.error('Set driver error:', error);
    }
  };

  /* -------------------- MOVE SAFARI -------------------- */
  const moveToSafari = async (vehicleIdentifier) => {
    const vehicle = vehicles.find(v => v.vehicleNumber === vehicleIdentifier || v.vehicleId === vehicleIdentifier);
    if (!vehicle?.driverName) return alert("Select driver first");

    try {
      const updated = vehicles.map(v =>
        (v.vehicleNumber === vehicleIdentifier || v.vehicleId === vehicleIdentifier) ? { ...v, status: "moved" } : v
      );
      
      if (vehicle.id) {
        await fetch(`${API_URL}/vehicle-assignments/${vehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "moved" })
        });
      }
      
      setVehicles(updated);

      // Record logs for each token in this vehicle
      await createLogsForVehicle(vehicle, 'move_to_safari');
    } catch (error) {
      console.error('Move to safari error:', error);
      alert('Failed to move vehicle to safari');
    }
  };

  const forceMoveToSafari = async (vehicleIdentifier) => {
    const vehicle = vehicles.find(v => v.vehicleNumber === vehicleIdentifier || v.vehicleId === vehicleIdentifier);

    if (!vehicle?.driverName) return alert("Select driver first");
    if (!vehicle.seatsFilled || vehicle.seatsFilled === 0)
      return alert("No passengers in vehicle");

    try {
      const updated = vehicles.map(v =>
        (v.vehicleNumber === vehicleIdentifier || v.vehicleId === vehicleIdentifier) ? { ...v, status: "moved" } : v
      );

      if (vehicle.id) {
        await fetch(`${API_URL}/vehicle-assignments/${vehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "moved" })
        });
      }
      
      setVehicles(updated);
      alert(`✓ Vehicle ${vehicle.vehicleNumber} moved to safari with ${vehicle.seatsFilled} passengers`);

      // Record logs for each token in this vehicle
      await createLogsForVehicle(vehicle, 'force_move_to_safari');
    } catch (error) {
      console.error('Force move error:', error);
      alert('Failed to move vehicle to safari');
    }
  };

  // Helper: create record logs for a vehicle grouped by token
const createLogsForVehicle = async (vehicle, action) => {
  try {
    const grouped = (vehicle.passengers || []).reduce((acc, p) => {
      // Extract main token number: 8 from 8a, 9 from 9b, etc.
      const mainToken = String(p.token).match(/\d+/)?.[0];
      if (!mainToken) return acc;

      acc[mainToken] = (acc[mainToken] || 0) + 1;
      return acc;
    }, {});

    // Create one record per token present in the vehicle
    for (const [token, count] of Object.entries(grouped)) {
      await fetch(`${API_URL}/record-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          safariDate: vehicle.safariDate,
          vehicleId: vehicle.vehicleId,
          vehicleNumber: vehicle.vehicleNumber,
          driverName: vehicle.driverName,
          token: Number(token),     // 8, 9
          personsCount: count,      // 1, 8
          runNumber: vehicle.runNumber,
          action
        })
      });
    }

  } catch (error) {
    console.error("Error creating record logs:", error);
  }
};
// 🔥 Merge record logs for same vehicle/time/driver/action/run
const mergedRecordLogs = useMemo(() => {
  return Object.values(
    recordLogs.reduce((acc, log) => {
      const timeKey = new Date(log.createdAt).toLocaleTimeString();

      const key = `${timeKey}-${log.vehicleNumber}-${log.driverName}-${log.action}-${log.runNumber}`;

      if (!acc[key]) {
        acc[key] = {
          ...log,
          timeKey,
          token: String(log.token),
          personsCount: Number(log.personsCount),
        };
      } else {
        acc[key].token += `,${log.token}`; // merge tokens
        acc[key].personsCount += Number(log.personsCount); // sum persons
      }

      return acc;
    }, {})
  );
}, [recordLogs]);


  /* -------------------- RENDER -------------------- */
  return (
    <div className="min-h-screen p-4 bg-green-50">
      {/* Tabs */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setActiveTab("reception")}
          className={`px-4 py-2 rounded font-semibold ${
            activeTab === "reception"
              ? "bg-green-700 text-white"
              : "bg-white border text-green-700"
          }`}
        >
          Reception Dashboard
        </button>

        <button
          onClick={() => setActiveTab("vehicle")}
          className={`px-4 py-2 rounded font-semibold ${
            activeTab === "vehicle"
              ? "bg-green-700 text-white"
              : "bg-white border text-green-700"
          }`}
        >
          Vehicle Dashboard
        </button>

        <button
          onClick={() => setActiveTab("recordlog")}
          className={`px-4 py-2 rounded font-semibold ${
            activeTab === "recordlog"
              ? "bg-green-700 text-white"
              : "bg-white border text-green-700"
          }`}
        >
          Record Log
        </button>
      </div>

      {/* -------------------- RECEPTION UI -------------------- */}
      {activeTab === "reception" && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-green-800">
            Reception Dashboard
          </h1>

          <div className="mb-4 flex gap-2 items-center">
            <label className="font-semibold">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={fetchBookings}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>

          {/* Summary Statistics Cards for Paid Visitors */}
          {!loading && filteredVisitors.length > 0 && (() => {
            const paidVisitors = filteredVisitors.filter(v => v.paymentDone);
            const totalPaidTokens = paidVisitors.length;
            const totalPaidSeats = paidVisitors.reduce((sum, v) => sum + (v.totalSeats || 0), 0);
            const totalCollection = paidVisitors.reduce((sum, v) => sum + (parseFloat(v.paymentAmount) || 0), 0);

            return (
              <div className="flex gap-4 mb-6 flex-wrap">
                <div className="flex-1 min-w-[250px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total Paid Tokens</p>
                      <p className="text-3xl font-bold mt-1">{totalPaidTokens}</p>
                    </div>
                    <div className="text-4xl opacity-80">🎫</div>
                  </div>
                </div>

                <div className="flex-1 min-w-[250px] bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total Seats (Paid)</p>
                      <p className="text-3xl font-bold mt-1">{totalPaidSeats}</p>
                    </div>
                    <div className="text-4xl opacity-80">💺</div>
                  </div>
                </div>

                <div className="flex-1 min-w-[250px] bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total Collection</p>
                      <p className="text-3xl font-bold mt-1">₹{totalCollection.toLocaleString()}</p>
                    </div>
                    <div className="text-4xl opacity-80">💰</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {loading && (
            <div className="text-center py-4 text-blue-600">
              Loading bookings...
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!loading && filteredVisitors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No bookings found for {selectedDate}
            </div>
          )}

          {!loading && filteredVisitors.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full border bg-white">
                <thead className="bg-green-200">
                  <tr>
                    <th className="p-2 border">Token</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Phone</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Time Slot</th>
                    <th className="p-2 border">Adults</th>
                    <th className="p-2 border">Children</th>
                    <th className="p-2 border">Total Seats</th>
                    <th className="p-2 border">Payment Mode</th>
                    <th className="p-2 border">UTR Number</th>
                    <th className="p-2 border">Amount (₹)</th>
                    <th className="p-2 border">Timer</th>
                    <th className="p-2 border">Payment Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVisitors.map(v => (
                    <tr key={v.id} className="text-center hover:bg-gray-50">
                      <td className="p-2 border font-bold text-blue-700 text-lg">{v.token}</td>
                      <td className="p-2 border">{v.name}</td>
                      <td className="p-2 border">{v.phone}</td>
                      <td className="p-2 border text-sm">{v.email}</td>
                      <td className="p-2 border">{v.safariDate}</td>
                      <td className="p-2 border">{v.timeSlot}</td>
                      <td className="p-2 border">{v.adults}</td>
                      <td className="p-2 border">{v.children}</td>
                      <td className="p-2 border font-semibold">{v.totalSeats}</td>
                      <td className="p-2 border">
                        {v.paymentDone ? (
                          <span className="font-semibold text-green-700">{v.paymentMode}</span>
                        ) : (
                          <select
                            value={v.paymentMode || ""}
                            onChange={e => setPaymentMode(v.id, e.target.value)}
                            className="border p-1 rounded w-full"
                          >
                            <option value="">Select</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                          </select>
                        )}
                      </td>
                      <td className="p-2 border">
                        {v.paymentDone ? (
                          <span className="text-gray-700 text-sm">{v.utrNumber || "-"}</span>
                        ) : (
                          <input
                            type="text"
                            value={v.utrNumber || ""}
                            onChange={e => setUtrNumber(v.id, e.target.value)}
                            placeholder="UTR/Ref No. (optional)"
                            className="border p-1 rounded w-full text-sm"
                          />
                        )}
                      </td>
                      <td className="p-2 border font-semibold">₹{v.paymentAmount}</td>
                      <td className="p-2 border text-red-600 font-mono">
                        {v.paymentDone ? "-" : formatTime(v.timeLeft)}
                      </td>
                      <td className="p-2 border">
                        <button
                          disabled={v.paymentDone}
                          onClick={() => markPaymentDone(v.id)}
                          className={`px-3 py-1 rounded text-white font-semibold ${
                            v.paymentDone 
                              ? "bg-green-600 cursor-default" 
                              : "bg-red-500 hover:bg-red-600 cursor-pointer"
                          }`}
                        >
                          {v.paymentDone ? "✓ Paid" : "Mark Paid"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* -------------------- VEHICLE DASHBOARD -------------------- */}
      {activeTab === "vehicle" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold text-green-800 mb-4">
            Vehicle Assignment Dashboard
          </h2>

          {/* Date selector */}
          <div className="mb-6 flex gap-2 items-center">
            <label className="font-semibold">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={() => {
                loadVehicles();
                fetchBookings();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Vehicles
            </button>
          </div>

          {/* Ongoing Safari Notification */}
          {vehicles.filter(v => (v.status === 'moved' || v.safariStatus === 'started') && v.safariStatus !== 'completed').length > 0 && (
            <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-400 rounded-lg">
              <h3 className="font-bold text-lg mb-2 text-orange-800 flex items-center gap-2">
                <span className="text-2xl">🚙</span>
                Ongoing Safari - Vehicles in Raid
              </h3>
              <div className="space-y-2">
                {vehicles
                  .filter(v => (v.status === 'moved' || v.safariStatus === 'started') && v.safariStatus !== 'completed')
                  .map((v, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border border-orange-300 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-orange-700 mr-3">🔒 {v.vehicleNumber}</span>
                        <span className="text-sm text-gray-700 mr-2">Driver: <span className="font-semibold">{v.driverName || 'N/A'}</span></span>
                        <span className="text-sm text-gray-700">Passengers: <span className="font-semibold">{v.seatsFilled}</span></span>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${
                          v.safariStatus === 'started' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {v.safariStatus === 'started' ? '🟢 Safari In Progress' : '⏳ Moved to Gate'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
              <p className="text-sm text-orange-700 mt-3 font-semibold">
                ⚠️ These vehicles and drivers are locked and unavailable for new assignments until safari ends at Gate.
              </p>
            </div>
          )}

          {/* Paid Visitors Ready for Assignment */}
          <div className="mb-6 border rounded p-4 bg-blue-50">
            <h3 className="font-bold text-lg mb-3 text-blue-800">
              Paid Bookings - Assign to Vehicle
            </h3>
            
            {filteredVisitors.filter(v => {
              if (!v.paymentDone) return false;
              // Hide bookings that have fully completed safari
              if (v.safariStatus === 'completed') return false;
              
              // Get all passengers assigned to this token across all vehicles
              const assignedPassengers = vehicles.flatMap(vehicle => 
                vehicle.passengers?.filter(p => p.token === v.token) || []
              );
              
              // If no assignments yet, show the token
              if (assignedPassengers.length === 0) return true;
              
              // Count passengers in completed vs non-completed safaris
              const passengersInCompleted = vehicles
                .filter(vehicle => vehicle.safariStatus === 'completed')
                .flatMap(vehicle => vehicle.passengers?.filter(p => p.token === v.token) || [])
                .length;
              
              const totalAssignedPassengers = assignedPassengers.length;
              
              // Hide token if ALL passengers have completed safari
              if (passengersInCompleted >= v.totalSeats && totalAssignedPassengers >= v.totalSeats) {
                return false;
              }
              
              return true;
            }).length === 0 ? (
              <p className="text-gray-500">No paid bookings pending vehicle assignment</p>
            ) : (
              <div className="space-y-2">
                {filteredVisitors
                  .filter(v => {
                    if (!v.paymentDone) return false;
                    // Hide bookings that have fully completed safari
                    if (v.safariStatus === 'completed') return false;
                    
                    // Get all passengers assigned to this token across all vehicles
                    const assignedPassengers = vehicles.flatMap(vehicle => 
                      vehicle.passengers?.filter(p => p.token === v.token) || []
                    );
                    
                    // If no assignments yet, show the token
                    if (assignedPassengers.length === 0) return true;
                    
                    // Count passengers in completed vs non-completed safaris
                    const passengersInCompleted = vehicles
                      .filter(vehicle => vehicle.safariStatus === 'completed')
                      .flatMap(vehicle => vehicle.passengers?.filter(p => p.token === v.token) || [])
                      .length;
                    
                    const totalAssignedPassengers = assignedPassengers.length;
                    
                    // Hide token if ALL passengers have completed safari
                    if (passengersInCompleted >= v.totalSeats && totalAssignedPassengers >= v.totalSeats) {
                      return false;
                    }
                    
                    return true;
                  })
                  .map(v => {
                    const assignedPassengers = vehicles.flatMap(vehicle => 
                      vehicle.passengers?.filter(p => p.token === v.token) || []
                    );
                    const assignedSeats = assignedPassengers.length;
                    const remainingSeats = v.totalSeats - assignedSeats;
                    const isPartial = remainingSeats > 0 && assignedSeats > 0;
                    
                    // Get all vehicles with available space (both new and partially filled)
                    const vehiclesWithSpace = [
                      // New vehicles from master list (not currently on safari)
                      ...availableVehicles.map(veh => ({
                        id: veh.id,
                        number: veh.number,
                        owner: veh.owner,
                        capacity: veh.capacity || 6,
                        available: veh.capacity || 6,
                        isNew: true
                      })),
                      // Partially filled vehicles (not on safari, has available seats)
                      ...vehicles
                        .filter(assignedV => 
                          assignedV.status !== 'moved' && 
                          assignedV.safariStatus !== 'started' &&
                          assignedV.seatsFilled < assignedV.capacity
                        )
                        .map(assignedV => ({
                          id: assignedV.vehicleId,
                          number: assignedV.vehicleNumber,
                          owner: assignedV.vehicleOwner,
                          capacity: assignedV.capacity,
                          available: assignedV.capacity - assignedV.seatsFilled,
                          isNew: false
                        }))
                    ];
                    
                    // Remove duplicates (prefer partially filled over new)
                    const uniqueVehicles = [];
                    const seenIds = new Set();
                    
                    // First add partially filled (priority)
                    vehiclesWithSpace.filter(v => !v.isNew).forEach(v => {
                      if (!seenIds.has(v.id)) {
                        uniqueVehicles.push(v);
                        seenIds.add(v.id);
                      }
                    });
                    
                    // Then add new vehicles not already in list
                    vehiclesWithSpace.filter(v => v.isNew).forEach(v => {
                      if (!seenIds.has(v.id)) {
                        uniqueVehicles.push(v);
                        seenIds.add(v.id);
                      }
                    });
                    
                    // Check if still need to assign (has remaining seats not in completed safaris)
                    const passengersInCompleted = vehicles
                      .filter(vehicle => vehicle.safariStatus === 'completed')
                      .flatMap(vehicle => vehicle.passengers?.filter(p => p.token === v.token) || [])
                      .length;
                    
                    const passengersInActive = vehicles
                      .filter(vehicle => vehicle.safariStatus !== 'completed')
                      .flatMap(vehicle => vehicle.passengers?.filter(p => p.token === v.token) || [])
                      .length;
                    
                    const totalInSafari = passengersInCompleted + passengersInActive;
                    const needsMoreAssignment = remainingSeats > 0 || (assignedSeats === 0 && passengersInCompleted === 0);
                    
                    return (
                    <div key={v.id} className={`bg-white p-3 rounded border flex items-center justify-between ${isPartial ? 'border-orange-400 border-2' : ''}`}>
                      <div className="flex-1">
                        <span className="font-bold text-blue-700 text-lg mr-3">Token #{v.token}</span>
                        <span className="mr-3">{v.name}</span>
                        <span className="text-sm text-gray-600 mr-3">({v.phone})</span>
                        {isPartial ? (
                          <>
                            <span className="font-semibold bg-orange-100 px-2 py-1 rounded text-sm text-orange-800 mr-2">
                              ⚠️ {assignedSeats}/{v.totalSeats} assigned
                            </span>
                            <span className="font-semibold bg-red-100 px-2 py-1 rounded text-sm text-red-800">
                              {remainingSeats} seats pending
                            </span>
                          </>
                        ) : assignedSeats === 0 ? (
                          <span className="font-semibold bg-green-100 px-2 py-1 rounded text-sm">
                            {v.totalSeats} seats ({v.adults} adults, {v.children} children)
                          </span>
                        ) : passengersInActive > 0 ? (
                          <span className="font-semibold bg-yellow-100 px-2 py-1 rounded text-sm text-yellow-800">
                            🟡 In Safari - All assigned
                          </span>
                        ) : (
                          <span className="font-semibold bg-green-100 px-2 py-1 rounded text-sm text-green-800">
                            ✅ Completed
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {needsMoreAssignment ? (
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              const vehicleId = parseInt(e.target.value);
                              const selectedVehicle = availableVehicles.find(veh => veh.id === vehicleId);
                              if (selectedVehicle) {
                                assignToVehicle(v, selectedVehicle);
                              }
                              e.target.value = "";
                            }
                          }}
                          className="border p-2 rounded bg-white"
                          defaultValue=""
                        >
                          <option value="">Assign to Vehicle...</option>
                          {uniqueVehicles.length === 0 ? (
                            <option disabled>No vehicles available</option>
                          ) : (
                            <>
                              {uniqueVehicles
                                .sort((a, b) => b.available - a.available) // Sort by most available seats
                                .map(vehicle => (
                                  <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.number} - {vehicle.owner} | {vehicle.available}/{vehicle.capacity} seats {vehicle.isNew ? '(Available)' : '(In Use)'}
                                  </option>
                                ))
                              }
                            </>
                          )}
                        </select>
                        ) : (
                          <span className="text-sm text-gray-500 italic px-3 py-2">
                            No action needed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                  })}
              </div>
            )}
          </div>

          {/* Vehicles List */}
          <div>
            <h3 className="font-bold text-lg mb-3 text-green-800">
              Assigned Vehicles ({vehicles.length})
            </h3>

            {vehicles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No vehicles assigned yet. Assign bookings to create vehicles.
              </p>
            ) : (
              <div className="space-y-3">
                {vehicles.map((v, index) => {
                  const isMoved = v.status === "moved";
                  const isStarted = v.safariStatus === "started";
                  const isCompleted = v.safariStatus === "completed";
                  const isFull = v.seatsFilled === v.capacity;
                  const isAssigned = v.seatsFilled > 0;
                  
                  // Gray out if assigned and moved/started
                  const isGrayedOut = isAssigned && (isMoved || isStarted || isCompleted);
                  
                  const groupedPassengers = v.passengers.reduce((acc, p) => {
                    if (!acc[p.token]) {
                      acc[p.token] = [];
                    }
                    acc[p.token].push(p);
                    return acc;
                  }, {});

                  // Get unique tokens for display
                  const uniqueTokens = [...new Set(v.passengers.map(p => p.token))];

                  return (
                    <details
                      key={v.id || `${v.vehicleId}-${index}`}
                      className={`border p-4 rounded transition-all ${
                        isGrayedOut 
                          ? "bg-gray-100 text-gray-600 border-gray-300" 
                          : isFull 
                            ? "bg-green-50 border-green-300" 
                            : "bg-white border-blue-200"
                      }`}
                      open={!isGrayedOut}
                    >
                      <summary className="cursor-pointer font-bold text-base flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            #{index + 1}
                          </span>
                          <span>
                            {v.vehicleNumber} {v.vehicleOwner && `(${v.vehicleOwner})`}
                          </span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            isGrayedOut ? 'bg-gray-300 text-gray-700' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {v.seatsFilled}/{v.capacity} seats
                          </span>
                          {uniqueTokens.length > 0 && (
                            <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              Tokens: {uniqueTokens.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isFull && !isGrayedOut && <span className="text-sm text-green-600 font-semibold">FULL</span>}
                          {isCompleted && <span className="text-sm text-green-700 font-semibold">✓ Completed</span>}
                          {isStarted && !isCompleted && <span className="text-sm text-red-600 font-semibold">🟢 In Safari</span>}
                          {isMoved && !isStarted && !isCompleted && <span className="text-sm text-orange-600 font-semibold">⏳ At Gate</span>}
                        </div>
                      </summary>

                    <div className="mt-4">
                      {/* Passengers by Token Group */}
                      {Object.entries(groupedPassengers).map(([token, passengers]) => (
                        <div key={token} className="mb-3 border-b pb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-blue-700">
                              Token #{token} - {passengers.length} person(s)
                            </span>
                            {!isGrayedOut && (
                              <button
                                onClick={() => unassignFromVehicle(v.vehicleId || v.vehicleNumber, token)}
                                className="text-red-600 text-sm hover:underline"
                                disabled={isGrayedOut}
                              >
                                Remove All
                              </button>
                            )}
                          </div>
                          
                          <div className="overflow-x-auto w-full">
  <table className="min-w-[650px] border mt-2 text-sm">
    <thead>
      <tr className="bg-gray-200">
        <th className="border p-2 whitespace-nowrap">Sub Token</th>
        <th className="border p-2 whitespace-nowrap">Name</th>
        <th className="border p-2 whitespace-nowrap">Phone</th>
        <th className="border p-2 whitespace-nowrap">Email</th>
      </tr>
    </thead>
    <tbody>
      {passengers.map(p => (
        <tr key={p.subToken}>
          <td className="border p-2 text-center font-mono font-bold whitespace-nowrap">
            {p.subToken}
          </td>
          <td className="border p-2 whitespace-nowrap">{p.name}</td>
          <td className="border p-2 whitespace-nowrap">{p.phone}</td>
          <td className="border p-2 text-sm whitespace-nowrap">
            {p.email}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

                        </div>
                      ))}

                      {/* Driver Selection */}
                      <div className="mt-4 flex gap-2 items-center">
                        <label className="font-semibold mr-2">Driver:</label>
                        <select
                          value={v.driverName}
                          onChange={e => setDriver(v.vehicleId || v.vehicleNumber, e.target.value)}
                          className="border p-2 rounded"
                          disabled={isGrayedOut}
                        >
                          <option value="">Select Driver</option>
                          {availableDrivers.map(driver => (
                            <option key={driver.id} value={driver.name}>{driver.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => moveToSafari(v.vehicleId || v.vehicleNumber)}
                          disabled={v.seatsFilled !== v.capacity || !v.driverName || isGrayedOut}
                          className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                            v.seatsFilled === v.capacity && v.driverName && !isGrayedOut
                              ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {isGrayedOut ? "✓ On Safari" : "Move to Safari (Full)"}
                        </button>
                        
                        <button
                          onClick={() => forceMoveToSafari(v.vehicleId || v.vehicleNumber)}
                          disabled={!v.driverName || isGrayedOut || v.seatsFilled === 0}
                          className={`px-6 py-3 rounded-lg font-bold text-sm border-2 transition-all ${
                            !isGrayedOut && v.driverName && v.seatsFilled > 0
                              ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-700 shadow-md"
                              : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                          }`}
                        >
                          🚀 Force Move ({v.seatsFilled}/{v.capacity} seats)
                        </button>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
          </div>
        </div>
      )}

      {/* -------------------- RECORD LOG TAB -------------------- */}
      {activeTab === "recordlog" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold text-green-800 mb-4">Record Log</h2>
          <div className="mb-4 flex gap-2 items-center">
            <label className="font-semibold">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={fetchRecordLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Logs
            </button>
          </div>

          {recordLogs.length === 0 ? (
            <p className="text-gray-500">No logs found for {selectedDate}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border bg-white">
                <thead className="bg-green-200">
                  <tr>
                    <th className="p-2 border">Time</th>
                    <th className="p-2 border">Vehicle</th>
                    <th className="p-2 border">Driver</th>
                    <th className="p-2 border">Token</th>
                    <th className="p-2 border">Persons</th>
                    <th className="p-2 border">Action</th>
                    <th className="p-2 border">Run</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedRecordLogs.map(log => (
                    <tr key={log.id} className="text-center hover:bg-gray-50">
                      <td className="p-2 border text-sm">{log.timeKey}</td>
                      <td className="p-2 border font-semibold">{log.vehicleNumber}</td>
                      <td className="p-2 border">{log.driverName || '-'}</td>
                      <td className="p-2 border">{log.token}</td>
                      <td className="p-2 border">{log.personsCount}</td>
                      <td className="p-2 border">{log.action.replaceAll('_',' ')}</td>
                      <td className="p-2 border">{log.runNumber ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
