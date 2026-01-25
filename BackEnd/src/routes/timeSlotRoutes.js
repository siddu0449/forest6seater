const express = require("express");
const router = express.Router();
const controller = require("../controllers/timeSlotController");

router.get("/", controller.getAllTimeSlots);
router.get("/active", controller.getActiveTimeSlots);

// ✅ ONLY RESET + UPDATE
router.post("/reset-defaults", controller.resetDefaultSlots);
router.put("/:id", controller.updateTimeSlot);

module.exports = router;
