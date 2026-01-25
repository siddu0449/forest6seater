const express = require("express");
const router = express.Router();
const {
  createRecordLog,
  getRecordLogs,
} = require("../controllers/recordLogController");

// POST /api/record-logs
router.post("/", createRecordLog);

// GET /api/record-logs?date=YYYY-MM-DD
router.get("/", getRecordLogs);

module.exports = router;
