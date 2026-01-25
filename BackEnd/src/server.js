const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const { VisitorBooking, UnpaidBooking } = require("./models");
const { Op } = require("sequelize");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5177",
      "http://localhost:5178",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Safari Management API",
    version: "1.0.0",
    status: "running",
  });
});
// 🔥 Expire unpaid bookings after 15 minutes
const expireUnpaidBookings = async () => {
  const now = Date.now();

  const expiredBookings = await VisitorBooking.findAll({
    where: {
      paymentDone: false,
      expiryTime: { [Op.lt]: now },
      expired: false,
    },
  });

  for (const booking of expiredBookings) {
    const [unpaid, created] = await UnpaidBooking.findOrCreate({
      where: { originalBookingId: booking.id },
      defaults: {
        token: booking.token,
        name: booking.name,
        phone: booking.phone,
        email: booking.email,
        safariDate: booking.safariDate,
        timeSlot: booking.timeSlot,
        adults: booking.adults,
        children: booking.children,
        totalSeats: booking.totalSeats,
        totalAmount: booking.paymentAmount,
        deletedAt: new Date(),
        reason: "Payment timeout - 15 minutes expired",
      },
    });

    // delete from visitor_bookings if it wasn't already moved
    if (created) {
      await booking.destroy();
    }
  }
};

// Run every 1 minute
setInterval(expireUnpaidBookings, 60 * 1000);

// API Routes
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/vehicle-driver", require("./routes/vehicleDriverRoutes"));
app.use(
  "/api/vehicle-assignments",
  require("./routes/vehicleAssignmentRoutes"),
);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/time-slots", require("./routes/timeSlotRoutes"));
app.use("/api/record-logs", require("./routes/recordLogRoutes"));

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
});

module.exports = app;
