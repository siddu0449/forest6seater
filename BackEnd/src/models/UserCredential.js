const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UserCredential = sequelize.define(
  "UserCredential",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        isIn: [["MANAGER", "RECEPTION", "GATE"]],
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "user_credentials",
    timestamps: true,
  }
);

module.exports = UserCredential;
