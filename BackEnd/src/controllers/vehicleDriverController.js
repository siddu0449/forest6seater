const { Driver, Vehicle } = require("../models");

// ============== DRIVERS ==============

/**
 * Get all drivers with availability for a specific date
 */
exports.getAllDrivers = async (req, res) => {
  try {
    const { date } = req.query;
    const drivers = await Driver.findAll({
      order: [["name", "ASC"]],
    });

    // If date is provided, add availability info
    if (date) {
      const driversWithAvailability = drivers.map((driver) => ({
        ...driver.toJSON(),
        availableOnDate: !driver.unavailableDates.includes(date),
      }));
      return res.status(200).json({
        success: true,
        data: driversWithAvailability,
      });
    }

    res.status(200).json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    console.error("Get drivers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch drivers",
      error: error.message,
    });
  }
};

/**
 * Get available drivers for a specific date
 */
exports.getAvailableDrivers = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    const drivers = await Driver.findAll({
      where: { active: true },
      order: [["name", "ASC"]],
    });

    // Filter drivers available on the date
    const availableDrivers = drivers.filter(
      (driver) => !driver.unavailableDates.includes(date),
    );

    res.status(200).json({
      success: true,
      data: availableDrivers,
    });
  } catch (error) {
    console.error("Get available drivers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available drivers",
      error: error.message,
    });
  }
};

/**
 * Add a new driver
 */
exports.addDriver = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Driver name is required",
      });
    }

    const driver = await Driver.create({
      name: name.trim(),
      active: true,
      unavailableDates: [],
    });

    res.status(201).json({
      success: true,
      message: "Driver added successfully",
      data: driver,
    });
  } catch (error) {
    console.error("Add driver error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add driver",
      error: error.message,
    });
  }
};

/**
 * Toggle driver's overall active status
 */
exports.toggleDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    driver.active = !driver.active;
    await driver.save();

    res.status(200).json({
      success: true,
      message: `Driver ${
        driver.active ? "activated" : "deactivated"
      } successfully`,
      data: driver,
    });
  } catch (error) {
    console.error("Toggle driver status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update driver status",
      error: error.message,
    });
  }
};

/**
 * Toggle driver availability for a specific date
 */
exports.toggleDriverAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    let unavailableDates = driver.unavailableDates || [];

    if (unavailableDates.includes(date)) {
      // Remove date - make available
      unavailableDates = unavailableDates.filter((d) => d !== date);
    } else {
      // Add date - make unavailable
      unavailableDates.push(date);
    }

    driver.unavailableDates = unavailableDates;
    await driver.save();

    res.status(200).json({
      success: true,
      message: "Driver availability updated",
      data: driver,
    });
  } catch (error) {
    console.error("Toggle driver availability error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update driver availability",
      error: error.message,
    });
  }
};

/**
 * Delete driver
 */
exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    await driver.destroy();

    res.status(200).json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("Delete driver error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete driver",
      error: error.message,
    });
  }
};

// ============== VEHICLES ==============

/**
 * Get all vehicles with availability for a specific date
 */
exports.getAllVehicles = async (req, res) => {
  try {
    const { date } = req.query;
    const vehicles = await Vehicle.findAll({
      order: [["number", "ASC"]],
    });

    // If date is provided, add availability info
    if (date) {
      const vehiclesWithAvailability = vehicles.map((vehicle) => ({
        ...vehicle.toJSON(),
        availableOnDate: !vehicle.unavailableDates.includes(date),
      }));
      return res.status(200).json({
        success: true,
        data: vehiclesWithAvailability,
      });
    }

    res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error("Get vehicles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
      error: error.message,
    });
  }
};

/**
 * Get available vehicles for a specific date
 */
exports.getAvailableVehicles = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    const vehicles = await Vehicle.findAll({
      where: { active: true },
      order: [["number", "ASC"]],
    });

    // Filter vehicles available on the date
    const availableVehicles = vehicles.filter(
      (vehicle) => !vehicle.unavailableDates.includes(date),
    );

    res.status(200).json({
      success: true,
      data: availableVehicles,
    });
  } catch (error) {
    console.error("Get available vehicles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available vehicles",
      error: error.message,
    });
  }
};

/**
 * Add a new vehicle
 */
exports.addVehicle = async (req, res) => {
  try {
    const { number, owner, capacity } = req.body;

    if (!number || !number.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number is required",
      });
    }

    if (!owner || !owner.trim()) {
      return res.status(400).json({
        success: false,
        message: "Owner name is required",
      });
    }

    // Check if vehicle already exists
    const existing = await Vehicle.findOne({
      where: { number: number.trim() },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with this number already exists",
      });
    }

    const vehicle = await Vehicle.create({
      number: number.trim(),
      owner: owner.trim(),
      capacity: capacity || 6,
      active: true,
      unavailableDates: [],
    });

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Add vehicle error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add vehicle",
      error: error.message,
    });
  }
};

/**
 * Toggle vehicle's overall active status
 */
exports.toggleVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    vehicle.active = !vehicle.active;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: `Vehicle ${
        vehicle.active ? "activated" : "deactivated"
      } successfully`,
      data: vehicle,
    });
  } catch (error) {
    console.error("Toggle vehicle status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle status",
      error: error.message,
    });
  }
};

/**
 * Toggle vehicle availability for a specific date
 */
exports.toggleVehicleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    let unavailableDates = vehicle.unavailableDates || [];

    if (unavailableDates.includes(date)) {
      // Remove date - make available
      unavailableDates = unavailableDates.filter((d) => d !== date);
    } else {
      // Add date - make unavailable
      unavailableDates.push(date);
    }

    vehicle.unavailableDates = unavailableDates;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle availability updated",
      data: vehicle,
    });
  } catch (error) {
    console.error("Toggle vehicle availability error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle availability",
      error: error.message,
    });
  }
};

/**
 * Delete vehicle
 */
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    await vehicle.destroy();

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
      error: error.message,
    });
  }
};
