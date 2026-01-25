const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UnpaidBooking = sequelize.define(
  "UnpaidBooking",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    originalBookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
       unique: true, 
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    safariDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    timeSlot: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    adults: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    children: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
   deletedAt: {
  type: DataTypes.DATE,
  allowNull: true,
},

    reason: {
      type: DataTypes.STRING,
      defaultValue: "Payment timeout - 15 minutes expired",
    },
  },
  {
    tableName: "unpaid_bookings",
    timestamps: false,
  }
);

module.exports = UnpaidBooking;
