const { sequelize } = require("./src/config/database");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database\n");

    // Check visitor_bookings table structure
    console.log("📋 Checking visitor_bookings table...");
    const [bookingsColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'visitor_bookings'
      ORDER BY ordinal_position;
    `);
    console.log(
      "Columns:",
      bookingsColumns.map((c) => `${c.column_name} (${c.data_type})`).join(", ")
    );

    // Check if utrNumber exists
    const hasUtrNumber = bookingsColumns.some(
      (c) => c.column_name === "utrNumber"
    );
    console.log(
      hasUtrNumber
        ? "✅ utrNumber column exists"
        : "❌ utrNumber column missing"
    );

    // Check unpaid_bookings table
    console.log("\n📋 Checking unpaid_bookings table...");
    const [unpaidExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'unpaid_bookings'
      );
    `);
    console.log(
      unpaidExists[0].exists
        ? "✅ unpaid_bookings table exists"
        : "❌ unpaid_bookings table missing"
    );

    if (unpaidExists[0].exists) {
      const [unpaidColumns] = await sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'unpaid_bookings';
      `);
      console.log(
        "Columns:",
        unpaidColumns.map((c) => c.column_name).join(", ")
      );
    }

    // Check time_slot_configs table
    console.log("\n📋 Checking time_slot_configs table...");
    const [slotsExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'time_slot_configs'
      );
    `);
    console.log(
      slotsExists[0].exists
        ? "✅ time_slot_configs table exists"
        : "❌ time_slot_configs table missing"
    );

    if (slotsExists[0].exists) {
      const [slotColumns] = await sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'time_slot_configs';
      `);
      console.log("Columns:", slotColumns.map((c) => c.column_name).join(", "));
    }

    console.log("\n✅ Database verification complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
