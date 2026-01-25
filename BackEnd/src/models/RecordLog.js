const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const RecordLog = sequelize.define(
  "RecordLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    safariDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    vehicleNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    driverName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    personsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    runNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    action: {
      type: DataTypes.ENUM("move_to_safari", "force_move_to_safari"),
      allowNull: false,
      defaultValue: "move_to_safari",
    },
  },
  {
    tableName: "record_logs",
    timestamps: true,
  },
);

module.exports = RecordLog;
