const { RecordLog } = require("../models");

// Create a new record log entry
exports.createRecordLog = async (req, res, next) => {
  try {
    const {
      safariDate,
      vehicleId,
      vehicleNumber,
      driverName,
      token,
      personsCount,
      runNumber,
      action,
    } = req.body;

    if (!safariDate || !vehicleNumber || !token) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: safariDate, vehicleNumber, token",
      });
    }

    const log = await RecordLog.create({
      safariDate,
      vehicleId: vehicleId || null,
      vehicleNumber,
      driverName: driverName || null,
      token,
      personsCount: personsCount || 0,
      runNumber: runNumber || null,
      action: action || "move_to_safari",
    });

    return res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// Get logs by date (optional filters: vehicleNumber, token)
exports.getRecordLogs = async (req, res, next) => {
  try {
    const { date, vehicleNumber, token } = req.query;

    const where = {};
    if (date) where.safariDate = date;
    if (vehicleNumber) where.vehicleNumber = vehicleNumber;
    if (token) where.token = token;

    const logs = await RecordLog.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
