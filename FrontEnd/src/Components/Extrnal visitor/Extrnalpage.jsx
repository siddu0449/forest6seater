import { useState, useMemo, useEffect } from "react";
import forestLogo from "../Images/Forest Logo.png";
import externalImg from "../Images/extrnal img.png";

const TIMER_DURATION = 15 * 60; // 15 minutes
const PLATFORM_FEE_PERCENT = 2.36; // 2.5%
const PLATFORM_FEE = 50; // change as needed
const MAX_SEATS_PER_TOKEN = 6;

// Default time slots - will be replaced by API data if available
const DEFAULT_TIME_SLOTS = [
  { timeSlot: "10:00 - 12:00", slotLimit: 60 },
  { timeSlot: "12:00 - 14:00", slotLimit: 60 },
  { timeSlot: "14:00 - 16:00", slotLimit: 60 },
  { timeSlot: "16:00 - 18:00", slotLimit: 60 },
];

/* ⏰ Check if slot is already started */
const isSlotExpiredByTime = (slot, safariDate) => {
  const [startTime] = slot.split(" - ");
  const slotDateTime = new Date(`${safariDate}T${startTime}:00`);
  return new Date() >= slotDateTime;
};

export default function ExternalVisitor() {
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
    safariDate: "",
    timeSlot: "",
    children: 0,
    adults: 0,
  });

  const [submitted, setSubmitted] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch active time slots from API
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const response = await fetch(`${API_URL}/time-slots/active`);
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setTimeSlots(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch time slots:', error);
        // Keep using default slots
      }
    };
    fetchTimeSlots();
  }, []);

  const visitorList =
    JSON.parse(localStorage.getItem("visitorList")) || [];

  const totalSeats =
    Number(formData.children) + Number(formData.adults);

 const baseAmount =
  Number(formData.children) * 300 +
  Number(formData.adults) * 600;

const platformFee =
  totalSeats > 0 ? parseFloat(((baseAmount * PLATFORM_FEE_PERCENT) / 100).toFixed(2)) : 0;

const totalAmount = baseAmount + platformFee;
  /* 🔐 SLOT AVAILABILITY WITH EXPIRY + TIME CHECK */
  const availableSlots = useMemo(() => {
    if (!formData.safariDate || totalSeats === 0) return [];

    const now = Date.now();

    return timeSlots
      .map((slotConfig) => {
        const slot = slotConfig.timeSlot;
        const slotLimit = slotConfig.slotLimit || SLOT_LIMIT;

        if (isSlotExpiredByTime(slot, formData.safariDate)) {
          return null;
        }

        const usedSeats = visitorList
          .filter(
            (v) =>
              v.safariDate === formData.safariDate &&
              v.timeSlot === slot &&
              (
                v.paymentDone === true ||
                (v.paymentDone === false && v.expiryTime > now)
              )
          )
          .reduce((sum, v) => sum + (v.totalSeats || 0), 0);

        const remainingSeats = slotLimit - usedSeats;

        return {
          slot,
          remainingSeats,
        };
      })
      .filter(
        (s) => s && s.remainingSeats >= totalSeats
      );
  }, [formData.safariDate, totalSeats, visitorList]);

  /* ♻️ AUTO MARK TOKENS AS EXPIRED */
  useEffect(() => {
    const interval = setInterval(() => {
      const list =
        JSON.parse(localStorage.getItem("visitorList")) || [];

      const now = Date.now();
      let updated = false;

      const updatedList = list.map((v) => {
        if (!v.paymentDone && !v.expired && v.expiryTime <= now) {
          updated = true;
          return { ...v, expired: true };
        }
        return v;
      });

      if (updated) {
        localStorage.setItem("visitorList", JSON.stringify(updatedList));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /* ✅ SAFE CHANGE HANDLER */
const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "adults" || name === "children") {
    const newValue = Number(value);

    const otherValue =
      name === "adults"
        ? Number(formData.children)
        : Number(formData.adults);

    if (newValue + otherValue > MAX_SEATS_PER_TOKEN) {
      return; // ❌ block change
    }
  }

  setFormData((prev) => ({
    ...prev,
    [name]: value,
    ...(name === "children" || name === "adults"
      ? { timeSlot: "" }
      : {}),
  }));
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          pincode: formData.pincode,
          safariDate: formData.safariDate,
          timeSlot: formData.timeSlot,
          adults: Number(formData.adults),
          children: Number(formData.children),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      setToken(data.data.token);
      setSubmitted(true);

      // Still save to localStorage as backup
      const visitorList = JSON.parse(localStorage.getItem("visitorList")) || [];
      const newVisitor = {
        id: data.data.id,
        token: data.data.token,
        ...formData,
        children: Number(formData.children),
        adults: Number(formData.adults),
        totalSeats,
        paymentAmount: totalAmount,
        paymentDone: false,
        paymentMode: "",
        vehicle: null,
        driver: null,
        expiryTime: data.data.expiryTime,
        expired: false,
        safariStatus: "pending",
      };
      visitorList.push(newVisitor);
      localStorage.setItem("visitorList", JSON.stringify(visitorList));

    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4"
      style={{
         backgroundImage: `url(${externalImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black opacity-30"></div>

      {/* Form Container */}
      <div className="relative bg-white bg-opacity-90 p-4 rounded-lg shadow-lg w-full max-w-sm z-10">
        <div className="flex justify-center mb-4">
          <img src={forestLogo} alt="Forest Logo" className="h-24 w-24" />
        </div>

        <h2 className="text-center font-bold text-green-800 mb-4">
          VISITOR SAFARI FORM
        </h2>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div className="flex flex-col">
              <label htmlFor="name" className="mb-1 font-semibold text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter full name"
                required
                value={formData.name}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col">
              <label htmlFor="phone" className="mb-1 font-semibold text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="Enter 10-digit phone number"
                required
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) {
                    setFormData((prev) => ({
                      ...prev,
                      phone: value,
                    }));
                  }
                }}
                className="border p-2 rounded"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label htmlFor="email" className="mb-1 font-semibold text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                required
                value={formData.email}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </div>
            {/* Address */}
<div className="flex flex-col">
  <label htmlFor="address" className="mb-1 font-semibold text-gray-700">
    Address
  </label>
  <textarea
    id="address"
    name="address"
    placeholder="Enter full address"
    required
    value={formData.address}
    onChange={handleChange}
    className="border p-2 rounded"
    rows={2}
  />
</div>
{/* Pincode */}
<div className="flex flex-col">
  <label htmlFor="pincode" className="mb-1 font-semibold text-gray-700">
    Pincode
  </label>
  <input
    id="pincode"
    name="pincode"
    type="text"
    inputMode="numeric"
    maxLength={6}
    placeholder="Enter 6-digit pincode"
    required
    value={formData.pincode}
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, "");
      if (value.length <= 6) {
        setFormData(prev => ({
          ...prev,
          pincode: value,
        }));
      }
    }}
    className="border p-2 rounded"
  />
</div>


            {/* Safari Date */}
            <div className="flex flex-col">
              <label htmlFor="safariDate" className="mb-1 font-semibold text-gray-700">
                Safari Date
              </label>
              <input
                id="safariDate"
                name="safariDate"
                type="date"
                required
                value={formData.safariDate}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </div>

            {/* Children & Adults */}
            <div className="flex gap-2">
              <div className="flex flex-col w-1/2">
                <label htmlFor="adults" className="mb-1 font-semibold text-gray-700">
                  Adults (₹600)
                </label>
                <input
                  id="adults"
                  name="adults"
                  type="number"
                  min="0"
                  required
                  value={formData.adults}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  placeholder="0"
                />
              </div>

              <div className="flex flex-col w-1/2">
                <label htmlFor="children" className="mb-1 font-semibold text-gray-700">
                  Children (₹300)
                </label>
                <input
                  id="children"
                  name="children"
                  type="number"
                  min="0"
                  required
                  value={formData.children}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Time Slot */}
            <div className="flex flex-col">
              <label htmlFor="timeSlot" className="mb-1 font-semibold text-gray-700">
                Select Time Slot
              </label>
              <select
                id="timeSlot"
                name="timeSlot"
                required
                value={formData.timeSlot}
                onChange={handleChange}
                className="border p-2 rounded"
                disabled={totalSeats === 0}
              >
                <option value="">Select Time Slot</option>
                {availableSlots.map(({ slot, remainingSeats }) => (
                  <option key={slot} value={slot}>
                    {slot} (Available: {remainingSeats})
                  </option>
                ))}
              </select>
            </div>

            {/* Seats & Amount */}
           <div className="text-sm text-center space-y-1">
  <div>Seats: <b>{totalSeats}</b></div>
  <div>Safari Amount: ₹{baseAmount}</div>
  <div>Platform Fee: ₹{platformFee}</div>
  <div className="font-bold">
    Total Payable: ₹{totalAmount}
  </div>
</div>


            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button 
              className="w-full bg-green-700 text-white py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-2">
            <p className="font-semibold text-green-700">
              Form Submitted ✅
            </p>
            <p className="text-lg font-bold">Your Token Number</p>
            <div className="text-3xl font-extrabold bg-yellow-300 inline-block px-6 py-2 rounded">
              {token}
            </div>
            <p className="text-sm text-gray-600">
              Pay within 15 minutes or token expires
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
