const { VisitorBooking, IndividualToken, UnpaidBooking } = require("../models");
const { Op } = require("sequelize");

// Time slots configuration (10 AM to 6 PM)
const TIME_SLOTS = [
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
];

const SLOT_LIMIT = 60;
const TIMER_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const PLATFORM_FEE_PERCENT = 2.36; // 2.5% of base amount


/**
 * Create a new visitor booking
 */
exports.createBooking = async (req, res) => {
  try {
    const { name, phone, email, address, pincode, safariDate, timeSlot, adults, children } =
      req.body;

    // Validate required fields
    if (!name || !phone || !email ||  !address || !pincode || !safariDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10 digits",
      });
    }
    if (!/^\d{6}$/.test(pincode)) {
  return res.status(400).json({
    success: false,
    message: "Pincode must be 6 digits",
  });
}


    // Calculate total seats and amount
    const adultsCount = Number(adults) || 0;
    const childrenCount = Number(children) || 0;
    const totalSeats = adultsCount + childrenCount;

    if (totalSeats === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one adult or child is required",
      });
    }

const baseAmount = adultsCount * 600 + childrenCount * 300;

// Calculate platform fee as percentage of base amount
const platformFee = parseFloat(((baseAmount * PLATFORM_FEE_PERCENT) / 100).toFixed(2));

const paymentAmount = baseAmount + platformFee;



    // Check slot availability
    const now = Date.now();
    const usedSeats =
      (await VisitorBooking.sum("totalSeats", {
        where: {
          safariDate,
          timeSlot,
          [Op.or]: [
            { paymentDone: true },
            {
              paymentDone: false,
              expiryTime: { [Op.gt]: now },
              expired: false,
            },
          ],
        },
      })) || 0;

    const remainingSeats = SLOT_LIMIT - usedSeats;

    if (remainingSeats < totalSeats) {
      return res.status(400).json({
        success: false,
        message: `Not enough seats available. Only ${remainingSeats} seats remaining.`,
      });
    }

  
// Generate unique token for the date (exclude expired/unpaid)
const maxTokenPaid = await VisitorBooking.max("token", {
  where: { safariDate },
});

const maxTokenUnpaid = await UnpaidBooking.max("token", {
  where: { safariDate },
});

const token = Math.max(maxTokenPaid || 0, maxTokenUnpaid || 0) + 1;


    // Set expiry time (15 minutes from now)
    const expiryTime = now + TIMER_DURATION;

    // Create booking
    const booking = await VisitorBooking.create({
      token,
      name,
      phone,
      email,
       address,
       pincode,
      safariDate,
      timeSlot,
      adults: adultsCount,
      children: childrenCount,
      totalSeats,
      paymentAmount,
      expiryTime,
      paymentDone: false,
      expired: false,
      safariStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        id: booking.id,
        token: booking.token,
        name: booking.name,
        address: booking.address,
        pincode: booking.pincode,
        safariDate: booking.safariDate,
        timeSlot: booking.timeSlot,
        totalSeats: booking.totalSeats,
        paymentAmount: booking.paymentAmount,
        expiryTime: booking.expiryTime,
      },
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

/**
 * Get available time slots for a specific date
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { safariDate, totalSeats } = req.query;

    if (!safariDate) {
      return res.status(400).json({
        success: false,
        message: "Safari date is required",
      });
    }

    const seatsNeeded = Number(totalSeats) || 1;
    const now = Date.now();

    const availableSlots = await Promise.all(
      TIME_SLOTS.map(async (slot) => {
        const usedSeats =
          (await VisitorBooking.sum("totalSeats", {
            where: {
              safariDate,
              timeSlot: slot,
              [Op.or]: [
                { paymentDone: true },
                {
                  paymentDone: false,
                  expiryTime: { [Op.gt]: now },
                  expired: false,
                },
              ],
            },
          })) || 0;

        const remainingSeats = SLOT_LIMIT - usedSeats;

        return {
          slot,
          remainingSeats,
          available: remainingSeats >= seatsNeeded,
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    console.error("Get available slots error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available slots",
      error: error.message,
    });
  }
};

/**
 * Get booking by token
 */
exports.getBookingByToken = async (req, res) => {
  try {
    const { token, safariDate } = req.params;

    const booking = await VisitorBooking.findOne({
      where: { token, safariDate },
      include: [
        {
          model: IndividualToken,
          as: "individualTokens",
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

/**
 * Assign individual tokens to group members
 */
exports.assignIndividualTokens = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { tokens } = req.body; // Array of {personName, personType}

    const booking = await VisitorBooking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (tokens.length !== booking.totalSeats) {
      return res.status(400).json({
        success: false,
        message: `Expected ${booking.totalSeats} tokens but received ${tokens.length}`,
      });
    }

    // Generate individual tokens (e.g., 1a, 1b, 1c, etc.)
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const individualTokensData = tokens.map((tokenData, index) => ({
      bookingId: booking.id,
      groupToken: booking.token,
      individualToken: `${booking.token}${letters[index]}`,
      personName: tokenData.personName || null,
      personType: tokenData.personType,
      assignedBy: req.user?.name || "system", // From auth middleware
    }));

    await IndividualToken.bulkCreate(individualTokensData);

    res.status(201).json({
      success: true,
      message: "Individual tokens assigned successfully",
      data: individualTokensData,
    });
  } catch (error) {
    console.error("Assign tokens error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign individual tokens",
      error: error.message,
    });
  }
};

/**
 * Mark payment as completed
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentMode, utrNumber } = req.body;

    const booking = await VisitorBooking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.expired) {
      return res.status(400).json({
        success: false,
        message: "Booking has expired",
      });
    }

    booking.paymentDone = true;
    booking.paymentMode = paymentMode || "cash";
    booking.utrNumber = utrNumber || null;
    booking.safariStatus = "confirmed";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
};

/**
 * Get all bookings (with filters)
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { safariDate, status } = req.query;

    const where = {};
    if (safariDate) where.safariDate = safariDate;
    if (status) where.safariStatus = status;

    // 1️⃣ PAID & ACTIVE BOOKINGS
    const bookings = await VisitorBooking.findAll({
      where,
      include: [{ model: IndividualToken, as: "individualTokens" }],
      order: [["safariDate", "DESC"], ["token", "ASC"]],
    });

    // 2️⃣ UNPAID / EXPIRED BOOKINGS
    const unpaidBookings = await UnpaidBooking.findAll({
      where: safariDate ? { safariDate } : {},
      order: [["deletedAt", "DESC"]],
    });

    // 3️⃣ FORMAT unpaid bookings for frontend
    const formattedUnpaid = unpaidBookings.map((ub) => ({
      id: `unpaid-${ub.id}`,
      token: ub.token,
      name: ub.name,
      phone: ub.phone,
      email: ub.email,
      address: ub.address,
      pincode: ub.pincode,
      safariDate: ub.safariDate,
      timeSlot: ub.timeSlot,
      adults: ub.adults,
      children: ub.children,
      totalSeats: ub.totalSeats,
      paymentAmount: ub.totalAmount,
      paymentDone: false,          // ⭐ IMPORTANT
      paymentMode: null,
      utrNumber: null,
      safariStatus: "expired",
    }));

    // 4️⃣ SEND MERGED DATA
    res.status(200).json({
      success: true,
      count: bookings.length + formattedUnpaid.length,
      data: [...bookings, ...formattedUnpaid],
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

/**
 * Delete a booking (for expired bookings)
 */
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await VisitorBooking.findByPk(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Save to unpaid_bookings before deleting (if payment not done)
   if (!booking.paymentDone) {
  const [unpaidRecord, created] = await UnpaidBooking.findOrCreate({
    where: { originalBookingId: booking.id },
    defaults: {
      originalBookingId: booking.id,
      token: booking.token,
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      address: booking.address,
      pincode: booking.pincode,
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
}


    // Delete the booking (IndividualTokens will be deleted automatically due to CASCADE)
    await booking.destroy();

    res.status(200).json({
      success: true,
      message: `Booking #${booking.token} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete booking",
      error: error.message,
    });
  }
};

/**
 * Get report data for a date range
 */
exports.getReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    // Validate required parameters
    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "Both fromDate and toDate are required",
      });
    }

    // Fetch all bookings within the date range
    const bookings = await VisitorBooking.findAll({
      where: {
        safariDate: {
          [Op.between]: [fromDate, toDate],
        },
        paymentDone: true, // Only get paid bookings
      },
    });

    // Fetch unpaid/deleted bookings within the date range
    const unpaidBookings = await UnpaidBooking.findAll({
      where: {
        safariDate: {
          [Op.between]: [fromDate, toDate],
        },
      },
      order: [["deletedAt", "DESC"]],
    });

    console.log(`📊 Report Query - Date Range: ${fromDate} to ${toDate}`);
    console.log(`✅ Found ${bookings.length} paid bookings`);
    console.log(`🚫 Found ${unpaidBookings.length} unpaid bookings`);
    if (unpaidBookings.length > 0) {
      console.log(
        "Unpaid bookings:",
        unpaidBookings.map((ub) => ({
          token: ub.token,
          name: ub.name,
          safariDate: ub.safariDate,
          totalAmount: ub.totalAmount,
        })),
      );
    }

    // Calculate statistics
    const totalVisitors = bookings.length; // All are paid now
    const paidBookings = bookings; // All bookings are paid

    const totalSeats = paidBookings.reduce(
      (sum, booking) => sum + (booking.totalSeats || 0),
      0,
    );
    const totalPayments = paidBookings.reduce(
      (sum, booking) => sum + (parseFloat(booking.paymentAmount) || 0),
      0,
    );
    const paymentsCompleted = paidBookings.length;
    const paymentsPending = 0; // No pending since we only fetch paid bookings

    const totalAdults = paidBookings.reduce(
      (sum, b) => sum + (b.adults || 0),
      0,
    );
    const totalChildren = paidBookings.reduce(
      (sum, b) => sum + (b.children || 0),
      0,
    );

    // Group by time slot
    const slotData = paidBookings.reduce((acc, v) => {
      const slot = v.timeSlot || "Unknown";
      if (!acc[slot]) {
        acc[slot] = { count: 0, seats: 0, amount: 0 };
      }
      acc[slot].count += 1;
      acc[slot].seats += parseInt(v.totalSeats) || 0;
      acc[slot].amount += parseFloat(v.paymentAmount) || 0;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalVisitors,
        totalSeats,
        totalPayments,
        totalAdults,
        totalChildren,
        paymentsCompleted,
        paymentsPending,
        slotData,
        bookings: bookings.map((b) => ({
          id: b.id,
          token: b.token,
          name: b.name,
          phone: b.phone,
          email: b.email,
          address: b.address,
          pincode: b.pincode,
          safariDate: b.safariDate,
          timeSlot: b.timeSlot,
          adults: b.adults,
          children: b.children,
          totalSeats: b.totalSeats,
          paymentAmount: b.paymentAmount,
          paymentDone: b.paymentDone,
          paymentMode: b.paymentMode,
          utrNumber: b.utrNumber,
        })),
        unpaidBookings: unpaidBookings.map((ub) => ({
          token: ub.token,
          name: ub.name,
          phone: ub.phone,
          email: ub.email,
          address: ub.address,
          pincode: ub.pincode,
          safariDate: ub.safariDate,
          timeSlot: ub.timeSlot,
          adults: ub.adults,
          children: ub.children,
          totalSeats: ub.totalSeats,
          totalAmount: ub.totalAmount,
          deletedAt: ub.deletedAt,
          reason: ub.reason,
        })),
        dateRange: {
          from: fromDate,
          to: toDate,
        },
      },
    });
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report data",
      error: error.message,
    });
  }
};
