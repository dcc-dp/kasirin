import "dotenv/config";
import { getDb } from "./index";

async function migrate() {
  const db = getDb();
  console.log("Starting Phase 1 Database Normalization...");

  try {
    // 1. Create stock_logs table if not exists
    console.log("1. Checking and creating stock_logs table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`stock_logs\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`product_id\` int NOT NULL,
        \`type\` enum('in','out','adjustment') NOT NULL,
        \`quantity\` int NOT NULL,
        \`stock_before\` int NOT NULL,
        \`stock_after\` int NOT NULL,
        \`reference_type\` varchar(50) DEFAULT NULL,
        \`reference_id\` int DEFAULT NULL,
        \`description\` longtext NOT NULL,
        \`user_id\` int DEFAULT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`stock_logs_product_id_fk\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`stock_logs_user_id_fk\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("   -> stock_logs table ready.");

    // 2. Modify transactions table: make member_id nullable
    console.log("2. Updating transactions: making member_id nullable...");
    await db.execute(`
      ALTER TABLE \`transactions\` MODIFY COLUMN \`member_id\` int NULL;
    `);
    console.log("   -> member_id is now nullable.");

    // 3. Add user_id column to transactions if it doesn't exist
    console.log("3. Checking user_id column on transactions...");
    const [userCol] = await db.execute(`
      SHOW COLUMNS FROM \`transactions\` LIKE 'user_id';
    `) as any;

    if (!userCol || userCol.length === 0) {
      await db.execute(`
        ALTER TABLE \`transactions\` ADD COLUMN \`user_id\` int NOT NULL DEFAULT 1 AFTER \`member_id\`;
      `);
      try {
        await db.execute(`
          ALTER TABLE \`transactions\` ADD CONSTRAINT \`transactions_user_id_fk\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`);
        `);
      } catch (fkErr) {
        console.log("   -> Foreign key note:", (fkErr as Error).message);
      }
      console.log("   -> user_id column added to transactions.");
    } else {
      console.log("   -> user_id column already exists on transactions.");
    }

    // 4. Add purchase_price column to transaction_details for HPP calculation
    console.log("4. Checking purchase_price column on transaction_details...");
    const [hppCol] = await db.execute(`
      SHOW COLUMNS FROM \`transaction_details\` LIKE 'purchase_price';
    `) as any;

    if (!hppCol || hppCol.length === 0) {
      await db.execute(`
        ALTER TABLE \`transaction_details\` ADD COLUMN \`purchase_price\` int NOT NULL DEFAULT 0 AFTER \`selling_price\`;
      `);
      console.log("   -> purchase_price column added to transaction_details.");
    } else {
      console.log("   -> purchase_price column already exists on transaction_details.");
    }

    // 5. Create cash_shifts table
    console.log("5. Checking and creating cash_shifts table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`cash_shifts\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` int NOT NULL,
        \`start_time\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`end_time\` datetime DEFAULT NULL,
        \`starting_cash\` int NOT NULL,
        \`expected_cash\` int DEFAULT NULL,
        \`actual_cash\` int DEFAULT NULL,
        \`difference\` int DEFAULT NULL,
        \`notes\` longtext DEFAULT NULL,
        \`status\` enum('open','closed') NOT NULL DEFAULT 'open',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`cash_shifts_user_id_fk\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("   -> cash_shifts table ready.");

    // 6. Create cash_movements table
    console.log("6. Checking and creating cash_movements table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`cash_movements\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`shift_id\` int NOT NULL,
        \`user_id\` int NOT NULL,
        \`type\` enum('in','out') NOT NULL,
        \`amount\` int NOT NULL,
        \`reason\` varchar(255) NOT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`cash_movements_shift_id_fk\` FOREIGN KEY (\`shift_id\`) REFERENCES \`cash_shifts\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`cash_movements_user_id_fk\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("   -> cash_movements table ready.");

    // 7. Performance Indexes
    console.log("7. Checking performance indexes...");
    try {
      await db.execute(`CREATE INDEX \`idx_products_barcode\` ON \`products\` (\`barcode\`);`);
    } catch (_) {}
    try {
      await db.execute(`CREATE INDEX \`idx_transactions_invoice\` ON \`transactions\` (\`invoice_number\`);`);
    } catch (_) {}
    try {
      await db.execute(`CREATE INDEX \`idx_transactions_date\` ON \`transactions\` (\`transaction_date\`);`);
    } catch (_) {}
    console.log("   -> Performance indexes ready.");

    console.log("✅ Phase 1 Database Normalization Completed Successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
