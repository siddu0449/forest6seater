const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const VisitorBooking = sequelize.define(
  "VisitorBooking",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Unique token number for the booking group",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    address: {
  type: DataTypes.TEXT,
  allowNull: false,
},

pincode: {
  type: DataTypes.STRING(6),
  allowNull: false,
  validate: {
    isNumeric: true,
    len: [6, 6],
  },
},

    safariDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    timeSlot: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "e.g., 10:00 - 12:00",
    },
    adults: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    children: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paymentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentDone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    paymentMode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    utrNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "UTR/Transaction reference number for UPI/online payments",
    },
    vehicle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    driver: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiryTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "Timestamp for payment expiry",
    },
    expired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    safariStatus: {
      type: DataTypes.ENUM("pending", "confirmed", "completed", "cancelled"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "visitor_bookings",
    timestamps: true,
  }
);

module.exports = VisitorBooking;
