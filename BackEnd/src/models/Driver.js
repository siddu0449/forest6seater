const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Driver = sequelize.define(
  "Driver",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Overall active status",
    },
    unavailableDates: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of dates when driver is unavailable",
    },
  },
  {
    tableName: "drivers",
    timestamps: true,
  }
);

module.exports = Driver;
