const { sequelize } = require("./src/config/database");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database");

    // Add utrNumber column to visitor_bookings table
    await sequelize.query(`
      ALTER TABLE visitor_bookings 
      ADD COLUMN IF NOT EXISTS "utrNumber" VARCHAR(255);
    `);

    console.log("✅ utrNumber column added successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
