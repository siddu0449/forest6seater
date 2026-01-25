import { useEffect, useState } from "react";
import ManagerTabs from "./ManagerTabs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function TimeSlotManagement() {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/time-slots`);
      const data = await res.json();
      if (data.success) setTimeSlots(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Reset defaults
  const resetDefaultSlots = async () => {
    if (!confirm("This will reset/update all 4 default time slots. Continue?"))
      return;

    try {
      const res = await fetch(`${API_URL}/time-slots/reset-defaults`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) fetchTimeSlots();
      else alert(data.message || "Failed to reset slots");
    } catch (err) {
      console.error(err);
      alert("Failed to reset default slots");
    }
  };

  // ✅ UPDATE SLOT (manual button)
  const updateSlot = async (slot) => {
    setUpdatingId(slot.id);
    try {
      const res = await fetch(`${API_URL}/time-slots/${slot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeSlot: slot.timeSlot,
          slotLimit: Number(slot.slotLimit),
          active: slot.active,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert("Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update slot");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleActiveLocal = (id) => {
    setTimeSlots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, active: !s.active } : s
      )
    );
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <ManagerTabs />
        <h2 className="text-xl md:text-2xl font-bold text-green-800">
          🕐 Default Time Slot Management
        </h2>
        <button
          onClick={resetDefaultSlots}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full md:w-auto"
        >
          Reset / Update Default Slots
        </button>
      </div>

      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Time Slot</th>
                <th className="p-3 text-left">Seat Limit</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, index) => (
                <tr key={slot.id} className="border-b">
                  <td className="p-3">
                    <input
                      value={slot.timeSlot}
                      onChange={(e) => {
                        const copy = [...timeSlots];
                        copy[index].timeSlot = e.target.value;
                        setTimeSlots(copy);
                      }}
                      className="w-full border px-2 py-1 rounded"
                    />
                  </td>

                  <td className="p-3">
                    <input
                      type="number"
                      min="1"
                      value={slot.slotLimit}
                      onChange={(e) => {
                        const copy = [...timeSlots];
                        copy[index].slotLimit = e.target.value;
                        setTimeSlots(copy);
                      }}
                      className="w-24 border px-2 py-1 rounded"
                    />
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => toggleActiveLocal(slot.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        slot.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {slot.active ? "Active" : "Inactive"}
                    </button>
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => updateSlot(slot)}
                      disabled={updatingId === slot.id}
                      className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingId === slot.id ? "Updating..." : "Update"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 p-3 rounded">
        <strong>Note:</strong> Changes will be visible to external visitors
        <b> only after clicking Update</b> for a slot.
      </div>
    </div>
  );
}
