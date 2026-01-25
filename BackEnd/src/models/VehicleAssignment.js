const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const VehicleAssignment = sequelize.define(
  "VehicleAssignment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "vehicles",
        key: "id",
      },
    },
    vehicleNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vehicleOwner: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    driverName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    safariDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    runNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 6,
    },
    seatsFilled: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    passengers: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment:
        "Array of passenger objects with subToken, token, name, phone, email",
    },
    status: {
      type: DataTypes.ENUM("waiting", "ready", "moved"),
      defaultValue: "waiting",
    },
    safariStatus: {
      type: DataTypes.ENUM("pending", "started", "completed"),
      defaultValue: "pending",
    },
    plasticCountIn: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    plasticCountOut: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gateInTime: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    gateOutTime: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "vehicle_assignments",
    timestamps: true,
  },
);

module.exports = VehicleAssignment;
