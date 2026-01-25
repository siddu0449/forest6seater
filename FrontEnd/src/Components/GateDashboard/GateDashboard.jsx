import { useEffect, useState, useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function GateDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [plasticInputs, setPlasticInputs] = useState({});

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // Load visitors and vehicles from localStorage
  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    const interval = setInterval(loadData, 1000); // Refresh every second
    return () => {
      window.removeEventListener("storage", loadData);
      clearInterval(interval);
    };
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const response = await fetch(`${API_URL}/vehicle-assignments?date=${selectedDate}`);
      const data = await response.json();

      if (data.success) {
        setVehicles(data.data);
      }
    } catch (err) {
      console.error('Load data error:', err);
    }
  };

  // Filter visitors for selected date and payment done
 // Get vehicles that have been moved to safari
const gateVehicles = useMemo(() => {
  return vehicles.filter(v => v.status === "moved").map(vehicle => {
    // Get unique tokens in this vehicle
    const uniqueTokens = [...new Set(vehicle.passengers?.map(p => p.token) || [])];
    
    return {
      ...vehicle,
      tokenCount: uniqueTokens.length,
      tokens: uniqueTokens.join(", "),
      passengerCount: vehicle.passengers?.length || 0,
      safariStatus: vehicle.safariStatus || "pending",
      gateInTime: vehicle.gateInTime,
      gateOutTime: vehicle.gateOutTime
    };
  });
}, [vehicles, selectedDate]);


  const updateStorage = async (vehicleNumber, updates) => {
    try {
      const vehicle = vehicles.find(v => v.vehicleNumber === vehicleNumber);
      if (!vehicle) return;

      const updatedVehicle = { ...vehicle, ...updates };
      
      await fetch(`${API_URL}/vehicle-assignments/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const updatedVehicles = vehicles.map(v =>
        v.vehicleNumber === vehicleNumber ? updatedVehicle : v
      );
      
      setVehicles(updatedVehicles);
    } catch (error) {
      console.error('Update storage error:', error);
      alert('Failed to update vehicle status');
    }
  };

  // ▶ START SAFARI
  const startSafari = (vehicleNumber) => {
    const plasticCount = plasticInputs[`in_${vehicleNumber}`];
    if (plasticCount === undefined || plasticCount === '') {
      alert('Please enter plastic count before starting safari');
      return;
    }
    updateStorage(vehicleNumber, {
      safariStatus: "started",
      gateInTime: Date.now(),
      plasticCountIn: parseInt(plasticCount)
    });
  };

  // ⏹ END SAFARI
  const endSafari = (vehicleNumber) => {
    const plasticCount = plasticInputs[`out_${vehicleNumber}`];
    if (plasticCount === undefined || plasticCount === '') {
      alert('Please enter plastic count before ending safari');
      return;
    }
    updateStorage(vehicleNumber, {
      safariStatus: "completed",
      gateOutTime: Date.now(),
      plasticCountOut: parseInt(plasticCount)
    });
  };

  const handlePlasticInput = (key, value) => {
    setPlasticInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen p-4 bg-green-50">
      <h1 className="text-2xl font-bold mb-4 text-green-800">Gate Dashboard</h1>

      <div className="mb-4 flex items-center gap-2">
        <label className="font-semibold">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-lg">
          <thead className="bg-green-200">
            <tr>
              <th className="p-2 border">Vehicle</th>
              <th className="p-2 border">Driver</th>
              <th className="p-2 border">Tokens</th>
              <th className="p-2 border">Passengers</th>
              <th className="p-2 border">Plastic In</th>
              <th className="p-2 border">Start Safari</th>
              <th className="p-2 border">Plastic Out</th>
              <th className="p-2 border">End Safari</th>
              <th className="p-2 border">Verification</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>

          <tbody>
            {gateVehicles.map((v) => {
              const isCompleted = v.safariStatus === "completed";
              const isStarted = v.safariStatus === "started";
              const plasticMatch = v.plasticCountIn !== undefined && v.plasticCountOut !== undefined && v.plasticCountIn === v.plasticCountOut;

              return (
                <tr
                  key={v.vehicleNumber}
                  className={`text-center ${isCompleted ? "bg-gray-100 text-gray-500" : ""}`}
                >
                  <td className="p-2 border font-bold text-blue-700">Vehicle {v.vehicleNumber}</td>
                  <td className="p-2 border">{v.driverName || "-"}</td>
                  <td className="p-2 border">
                    <span className="font-semibold">#{v.tokens}</span>
                    <br />
                    <span className="text-xs text-gray-600">({v.tokenCount} booking{v.tokenCount > 1 ? 's' : ''})</span>
                  </td>
                  <td className="p-2 border font-semibold">{v.passengerCount} people</td>
                  <td className="p-2 border">
                    {v.safariStatus === "pending" ? (
                      <input
                        type="number"
                        min="0"
                        placeholder="Count"
                        value={plasticInputs[`in_${v.vehicleNumber}`] || ''}
                        onChange={(e) => handlePlasticInput(`in_${v.vehicleNumber}`, e.target.value)}
                        className="w-20 p-1 border rounded text-center"
                      />
                    ) : (
                      <span className="font-bold text-blue-700">{v.plasticCountIn || 0}</span>
                    )}
                  </td>
                  <td className="p-2 border">
                    <button
                      onClick={() => startSafari(v.vehicleNumber)}
                      disabled={v.safariStatus !== "pending"}
                      className={`px-3 py-2 rounded text-white font-semibold ${
                        v.safariStatus === "pending" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      ▶ Start
                    </button>
                  </td>
                  <td className="p-2 border">
                    {isStarted ? (
                      <input
                        type="number"
                        min="0"
                        placeholder="Count"
                        value={plasticInputs[`out_${v.vehicleNumber}`] || ''}
                        onChange={(e) => handlePlasticInput(`out_${v.vehicleNumber}`, e.target.value)}
                        className="w-20 p-1 border rounded text-center"
                      />
                    ) : isCompleted ? (
                      <span className="font-bold text-green-700">{v.plasticCountOut || 0}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-2 border">
                    <button
                      onClick={() => endSafari(v.vehicleNumber)}
                      disabled={v.safariStatus !== "started"}
                      className={`px-3 py-2 rounded text-white font-semibold ${
                        v.safariStatus === "started" ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      ⏹ End
                    </button>
                  </td>
                  <td className="p-2 border">
                    {isCompleted ? (
                      plasticMatch ? (
                        <span className="font-bold text-green-600 bg-green-100 px-3 py-1 rounded">✓ OK</span>
                      ) : (
                        <span className="font-bold text-red-600 bg-red-100 px-3 py-1 rounded">✗ MISMATCH</span>
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-2 border">
                    <span className={`font-semibold capitalize px-2 py-1 rounded ${
                      v.safariStatus === "completed" ? "bg-green-100 text-green-800" :
                      v.safariStatus === "started" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {v.safariStatus}
                    </span>
                  </td>
                </tr>
              );
            })}

            {gateVehicles.length === 0 && (
              <tr>
                <td colSpan="10" className="p-4 text-center text-gray-500">
                  No vehicles moved to safari yet for selected date
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
