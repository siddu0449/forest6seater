import { useEffect, useState } from "react";
import ManagerTabs from "./ManagerTabs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ManageVehicleDriver() {
  const [loading, setLoading] = useState(false);

  // ---------------- DRIVERS ----------------
  const [drivers, setDrivers] = useState([]);
  const [driverName, setDriverName] = useState("");

  // ---------------- VEHICLES ----------------
  const [vehicles, setVehicles] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, []);

  // ---------------- FETCH ----------------
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/vehicle-driver/drivers`);
      const data = await res.json();
      if (data.success) setDrivers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/vehicle-driver/vehicles`);
      const data = await res.json();
      if (data.success) setVehicles(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DRIVER ACTIONS ----------------
  const addDriver = async () => {
    if (!driverName.trim()) return;

    const res = await fetch(`${API_URL}/vehicle-driver/drivers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: driverName }),
    });

    const data = await res.json();
    if (data.success) {
      setDriverName("");
      fetchDrivers();
    }
  };

  const toggleDriver = async (id) => {
    await fetch(`${API_URL}/vehicle-driver/drivers/${id}/toggle-status`, {
      method: "PUT",
    });
    fetchDrivers();
  };

  const deleteDriver = async (id) => {
    if (!confirm("Delete this driver?")) return;
    await fetch(`${API_URL}/vehicle-driver/drivers/${id}`, {
      method: "DELETE",
    });
    fetchDrivers();
  };

  // ---------------- VEHICLE ACTIONS ----------------
  const addVehicle = async () => {
    if (!vehicleNumber.trim() || !ownerName.trim()) return;

    const res = await fetch(`${API_URL}/vehicle-driver/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: vehicleNumber,
        owner: ownerName,
        capacity: 6,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setVehicleNumber("");
      setOwnerName("");
      fetchVehicles();
    }
  };

  const toggleVehicle = async (id) => {
    await fetch(`${API_URL}/vehicle-driver/vehicles/${id}/toggle-status`, {
      method: "PUT",
    });
    fetchVehicles();
  };

  const deleteVehicle = async (id) => {
    if (!confirm("Delete this vehicle?")) return;
    await fetch(`${API_URL}/vehicle-driver/vehicles/${id}`, {
      method: "DELETE",
    });
    fetchVehicles();
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Manage Vehicle & Driver</h1>
      <ManagerTabs />

      {/* ================= DRIVERS ================= */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Drivers</h2>

        <div className="flex gap-3 mb-4">
          <input
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="Driver Name"
            className="border p-2 rounded w-64"
          />
          <button onClick={addDriver} className="bg-blue-600 text-white px-4 rounded">
            Add Driver
          </button>
        </div>

        <table className="w-full border">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="text-center">
                <td className="p-2 border">{d.name}</td>
                <td className="p-2 border">
                  <span
                    className={`px-2 py-1 rounded ${
                      d.active ? "bg-green-200" : "bg-gray-300"
                    }`}
                  >
                    {d.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-2 border flex justify-center gap-2">
                  <button
                    onClick={() => toggleDriver(d.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    {d.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteDriver(d.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= VEHICLES ================= */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Vehicles</h2>

        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            placeholder="Vehicle Number"
            className="border p-2 rounded"
          />
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Owner Name"
            className="border p-2 rounded"
          />
          <button onClick={addVehicle} className="bg-blue-600 text-white px-4 rounded">
            Add Vehicle
          </button>
        </div>

        <table className="w-full border">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Vehicle</th>
              <th className="p-2 border">Owner</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="text-center">
                <td className="p-2 border">{v.number}</td>
                <td className="p-2 border">{v.owner}</td>
                <td className="p-2 border">
                  <span
                    className={`px-2 py-1 rounded ${
                      v.active ? "bg-green-200" : "bg-gray-300"
                    }`}
                  >
                    {v.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-2 border flex justify-center gap-2">
                  <button
                    onClick={() => toggleVehicle(v.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    {v.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteVehicle(v.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
