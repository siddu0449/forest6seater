const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const TimeSlotConfig = sequelize.define(
  "TimeSlotConfig",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    timeSlot: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "Time slot e.g., 10:00 - 12:00",
    },
    slotLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      comment: "Maximum number of seats available for this slot",
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Whether this slot is active/available",
    },
  },
  {
    tableName: "time_slot_configs",
    timestamps: true,
  }
);

module.exports = TimeSlotConfig;
