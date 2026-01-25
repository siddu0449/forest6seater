const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SecurityQuestion = sequelize.define(
  "SecurityQuestion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    question: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    answer: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "security_questions",
    timestamps: true,
  }
);

module.exports = SecurityQuestion;
