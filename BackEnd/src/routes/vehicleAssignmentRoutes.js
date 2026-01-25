const express = require("express");
const router = express.Router();
const vehicleAssignmentController = require("../controllers/vehicleAssignmentController");

// Get all vehicle assignments for a specific date
router.get("/", vehicleAssignmentController.getVehicleAssignments);

// Create or update vehicle assignment
router.post("/", vehicleAssignmentController.saveVehicleAssignment);

// Update vehicle assignment
router.put("/:id", vehicleAssignmentController.updateVehicleAssignment);

// Delete vehicle assignment
router.delete("/:id", vehicleAssignmentController.deleteVehicleAssignment);

module.exports = router;
