const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const IndividualToken = sequelize.define(
  "IndividualToken",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "visitor_bookings",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    groupToken: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Main token number (e.g., 1)",
    },
    individualToken: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Individual token like 1a, 1b, 1c, etc.",
    },
    personName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    personType: {
      type: DataTypes.ENUM("adult", "child"),
      allowNull: false,
    },
    assignedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Admin/Staff who assigned the token",
    },
  },
  {
    tableName: "individual_tokens",
    timestamps: true,
  }
);

module.exports = IndividualToken;
