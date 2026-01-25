const express = require("express");
const router = express.Router();
const controller = require("../controllers/vehicleDriverController");

// ============== DRIVER ROUTES ==============

/**
 * @route   GET /api/vehicle-driver/drivers
 * @desc    Get all drivers (with optional date filter)
 * @access  Private (Manager, Reception)
 */
router.get("/drivers", controller.getAllDrivers);

/**
 * @route   GET /api/vehicle-driver/drivers/available
 * @desc    Get available drivers for a specific date
 * @access  Private (Reception)
 */
router.get("/drivers/available", controller.getAvailableDrivers);

/**
 * @route   POST /api/vehicle-driver/drivers
 * @desc    Add a new driver
 * @access  Private (Manager)
 */
router.post("/drivers", controller.addDriver);

/**
 * @route   PUT /api/vehicle-driver/drivers/:id/toggle-status
 * @desc    Toggle driver's overall active status
 * @access  Private (Manager)
 */
router.put("/drivers/:id/toggle-status", controller.toggleDriverStatus);

/**
 * @route   PUT /api/vehicle-driver/drivers/:id/toggle-availability
 * @desc    Toggle driver availability for a specific date
 * @access  Private (Manager)
 */
router.put(
  "/drivers/:id/toggle-availability",
  controller.toggleDriverAvailability
);

/**
 * @route   DELETE /api/vehicle-driver/drivers/:id
 * @desc    Delete a driver
 * @access  Private (Manager)
 */
router.delete("/drivers/:id", controller.deleteDriver);

// ============== VEHICLE ROUTES ==============

/**
 * @route   GET /api/vehicle-driver/vehicles
 * @desc    Get all vehicles (with optional date filter)
 * @access  Private (Manager, Reception)
 */
router.get("/vehicles", controller.getAllVehicles);

/**
 * @route   GET /api/vehicle-driver/vehicles/available
 * @desc    Get available vehicles for a specific date
 * @access  Private (Reception)
 */
router.get("/vehicles/available", controller.getAvailableVehicles);

/**
 * @route   POST /api/vehicle-driver/vehicles
 * @desc    Add a new vehicle
 * @access  Private (Manager)
 */
router.post("/vehicles", controller.addVehicle);

/**
 * @route   PUT /api/vehicle-driver/vehicles/:id/toggle-status
 * @desc    Toggle vehicle's overall active status
 * @access  Private (Manager)
 */
router.put("/vehicles/:id/toggle-status", controller.toggleVehicleStatus);

/**
 * @route   PUT /api/vehicle-driver/vehicles/:id/toggle-availability
 * @desc    Toggle vehicle availability for a specific date
 * @access  Private (Manager)
 */
router.put(
  "/vehicles/:id/toggle-availability",
  controller.toggleVehicleAvailability
);

/**
 * @route   DELETE /api/vehicle-driver/vehicles/:id
 * @desc    Delete a vehicle
 * @access  Private (Manager)
 */
router.delete("/vehicles/:id", controller.deleteVehicle);

module.exports = router;
