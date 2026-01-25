const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Vehicle = sequelize.define(
  "Vehicle",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "Vehicle registration number",
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Vehicle owner name",
    },
    capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 6,
      comment: "Seating capacity",
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Overall active status",
    },
    unavailableDates: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of dates when vehicle is unavailable",
    },
  },
  {
    tableName: "vehicles",
    timestamps: true,
  },
);

module.exports = Vehicle;
