const { VehicleAssignment, VisitorBooking } = require("../models");

// Get all vehicle assignments for a specific date
exports.getVehicleAssignments = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    const assignments = await VehicleAssignment.findAll({
      where: { safariDate: date },
      order: [["createdAt", "ASC"]],
    });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Get vehicle assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle assignments",
      error: error.message,
    });
  }
};

// Create or update vehicle assignment
exports.saveVehicleAssignment = async (req, res) => {
  try {
    const {
      vehicleId,
      vehicleNumber,
      vehicleOwner,
      driverName,
      safariDate,
      runNumber,
      capacity,
      seatsFilled,
      passengers,
      status,
      safariStatus,
      plasticCountIn,
      plasticCountOut,
      gateInTime,
      gateOutTime,
    } = req.body;

    if (!vehicleId || !vehicleNumber || !safariDate) {
      return res.status(400).json({
        success: false,
        message: "vehicleId, vehicleNumber, and safariDate are required",
      });
    }

    // Check if assignment already exists
    const existing = await VehicleAssignment.findOne({
      where: {
        vehicleId,
        safariDate,
      },
    });

    let assignment;
    if (existing) {
      // Update existing
      await existing.update({
        vehicleNumber,
        vehicleOwner,
        driverName,
        capacity,
        seatsFilled,
        passengers,
        status,
        safariStatus,
        plasticCountIn,
        plasticCountOut,
        gateInTime,
        gateOutTime,
      });
      assignment = existing;
    } else {
      // Create new
      assignment = await VehicleAssignment.create({
        vehicleId,
        vehicleNumber,
        vehicleOwner,
        driverName,
        safariDate,
        runNumber: runNumber ?? 1,
        capacity: capacity || 6,
        seatsFilled: seatsFilled || 0,
        passengers: passengers || [],
        status: status || "waiting",
        safariStatus: safariStatus || "pending",
        plasticCountIn,
        plasticCountOut,
        gateInTime,
        gateOutTime,
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("Save vehicle assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save vehicle assignment",
      error: error.message,
    });
  }
};

// Update vehicle assignment (for driver, status, gate info, plastic count)
exports.updateVehicleAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const assignment = await VehicleAssignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Vehicle assignment not found",
      });
    }

    await assignment.update(updates);

    // If safari completed for this assignment, check and update related bookings
    if (updates.safariStatus === "completed") {
      try {
        // Fetch all completed assignments for the same date
        const completedAssignments = await VehicleAssignment.findAll({
          where: {
            safariDate: assignment.safariDate,
            safariStatus: "completed",
          },
        });

        // Build token -> completed passenger count map
        const tokenCompletedCounts = new Map();
        for (const a of completedAssignments) {
          const passengers = Array.isArray(a.passengers) ? a.passengers : [];
          for (const p of passengers) {
            if (!p?.token) continue;
            tokenCompletedCounts.set(
              p.token,
              (tokenCompletedCounts.get(p.token) || 0) + 1,
            );
          }
        }

        // For each token present in this assignment, set booking to completed when fully done
        const thisTokens = Array.from(
          new Set(
            (Array.isArray(assignment.passengers) ? assignment.passengers : [])
              .map((p) => p.token)
              .filter(Boolean),
          ),
        );

        for (const tkn of thisTokens) {
          const booking = await VisitorBooking.findOne({
            where: { token: tkn, safariDate: assignment.safariDate },
          });
          if (!booking) continue;

          const completedCount = tokenCompletedCounts.get(tkn) || 0;
          if (completedCount >= (booking.totalSeats || 0)) {
            booking.safariStatus = "completed";
            await booking.save();
          }
        }
      } catch (e) {
        console.error("Booking completion update error:", e);
        // Do not fail the main request due to auxiliary update
      }
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("Update vehicle assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle assignment",
      error: error.message,
    });
  }
};

// Delete vehicle assignment
exports.deleteVehicleAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await VehicleAssignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Vehicle assignment not found",
      });
    }

    await assignment.destroy();

    res.json({
      success: true,
      message: "Vehicle assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle assignment",
      error: error.message,
    });
  }
};
