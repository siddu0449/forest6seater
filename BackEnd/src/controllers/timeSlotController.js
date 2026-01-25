const { TimeSlotConfig } = require("../models");

const DEFAULT_TIME_SLOTS = [
  { timeSlot: "10:00 - 12:00", slotLimit: 60, active: true },
  { timeSlot: "12:00 - 14:00", slotLimit: 60, active: true },
  { timeSlot: "14:00 - 16:00", slotLimit: 60, active: true },
  { timeSlot: "16:00 - 18:00", slotLimit: 60, active: true },
];

// ✅ GET ALL (Manager)
exports.getAllTimeSlots = async (req, res) => {
  try {
    const slots = await TimeSlotConfig.findAll({
      order: [["id", "ASC"]],
    });

    res.json({ success: true, data: slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ✅ GET ACTIVE (Booking)
exports.getActiveTimeSlots = async (req, res) => {
  try {
    const slots = await TimeSlotConfig.findAll({
      where: { active: true },
      order: [["id", "ASC"]],
    });

    res.json({
      success: true,
      data: slots.map(s => ({
        timeSlot: s.timeSlot,
        slotLimit: s.slotLimit,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ✅ RESET DEFAULTS (ONLY BUTTON)
exports.resetDefaultSlots = async (req, res) => {
  try {
    await TimeSlotConfig.destroy({ where: {} });
    const slots = await TimeSlotConfig.bulkCreate(DEFAULT_TIME_SLOTS);

    res.json({
      success: true,
      message: "Default slots reset",
      data: slots,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ✅ UPDATE SLOT
exports.updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false });
    }

    const slot = await TimeSlotConfig.findByPk(id);
    if (!slot) {
      return res.status(404).json({ success: false });
    }

    const { timeSlot, slotLimit, active } = req.body;

    if (timeSlot !== undefined) slot.timeSlot = timeSlot;
    if (slotLimit !== undefined) slot.slotLimit = slotLimit;
    if (active !== undefined) slot.active = active;

    await slot.save();

    res.json({ success: true, data: slot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
