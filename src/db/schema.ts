import {
  int,
  longtext,
  mysqlEnum,
  mysqlTable,
  foreignKey,
  serial,
  varchar,
  datetime,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm/sql/sql";

export const menus = mysqlTable("menus", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  path: varchar({ length: 255 }).notNull(),
  permission_path: varchar({ length: 255 }),
  icon: varchar({ length: 255 }),
  parent_id: int(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
},
  (table) => ({
    menus_fk: foreignKey({
      columns: [table.parent_id],
      foreignColumns: [table.id],
    }),
  }),
);

export const roles = mysqlTable("roles", {
  id: int().primaryKey().autoincrement(),
  code: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const role_permissions = mysqlTable("role_permissions", {
  id: int().primaryKey().autoincrement(),
  role_id: int().notNull(),
  menu_id: int().notNull(),
  can_read: boolean().notNull().default(false),
  can_create: boolean().notNull().default(false),
  can_update: boolean().notNull().default(false),
  can_delete: boolean().notNull().default(false),
  can_report: boolean().notNull().default(false),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
},
  (table) => ({
    role_fk: foreignKey({
      columns: [table.role_id],
      foreignColumns: [roles.id],
    }),
    menu_fk: foreignKey({
      columns: [table.menu_id],
      foreignColumns: [menus.id],
    }),
  }),
);

export const users = mysqlTable("users", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  role_id: int().notNull(),
  is_active: boolean().notNull().default(false),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
},
  (table) => ({
    role_fk: foreignKey({
      columns: [table.role_id],
      foreignColumns: [roles.id],
    }),
  }),
);

export const suppliers = mysqlTable("suppliers", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 255 }).notNull(),
  address: longtext().notNull(),
  email: varchar({ length: 255 }).notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const categoris = mysqlTable("categoris", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  description: longtext().notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const units = mysqlTable("units", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  description: longtext().notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const products = mysqlTable("products", {
  id: int().primaryKey().autoincrement(),
  category_id: int().notNull(),
  unit_id: int().notNull(),
  barcode: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: longtext().notNull(),
  purchase_price: int().notNull(),
  selling_price: int().notNull(),
  stock: int().notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
},
  (table) => ({
    category_fk: foreignKey({
      columns: [table.category_id],
      foreignColumns: [categoris.id],
    }),
    unit_fk: foreignKey({
      columns: [table.unit_id],
      foreignColumns: [units.id],
    }),
  }),
);

export const stock_logs = mysqlTable(
    "stock_logs",
    {
      id: int().primaryKey().autoincrement(),

      product_id: int().notNull(),

      type: mysqlEnum("type", [
        "in",
        "out",
        "adjustment",
      ]).notNull(),

      quantity: int().notNull(),

      stock_before: int().notNull(),
      stock_after: int().notNull(),

      reference_type: varchar({ length: 50 }),
      reference_id: int(),

      description: longtext().notNull(),

      user_id: int(),

      created_at: datetime()
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),

      updated_at: datetime()
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    },
    (table) => ({
      product_id_fk: foreignKey({
        columns: [table.product_id],
        foreignColumns: [products.id],
      }),

      user_id_fk: foreignKey({
        columns: [table.user_id],
        foreignColumns: [users.id],
      }),
    })
  );

export const members = mysqlTable("members", {
  id: int().primaryKey().autoincrement(),
  nama: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 255 }).notNull(),
  address: longtext().notNull(),
  poin: int().notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int().primaryKey().autoincrement(),
  invoice_number: varchar({ length: 255 }).notNull(),
  member_id: int(),
  user_id: int().notNull(),
  point_gained: int(),
  transaction_date: datetime(),
  subtotal: int().notNull(),
  discount: int().notNull(),
  grand_total: int().notNull(),
  payment_methode: mysqlEnum("payment_method", ["cash", "transfer", "qris"]).notNull(),
  paid_amount: int().notNull(),
  change_amount: int().notNull(),
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).notNull(),
  tax: int().notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
},
  (table) => ({
    member_id_fk: foreignKey({
      columns: [table.member_id],
      foreignColumns: [members.id],
    }),
    user_id_fk: foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
    }),
  })
);

export const transaction_details = mysqlTable("transaction_details", {
  id: int().primaryKey().autoincrement(),
  transaction_id: int().notNull(),
  product_id: int().notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: longtext().notNull(),
  selling_price: int().notNull(),
  purchase_price: int().notNull().default(0),
  quantity: int().notNull(),
  subtotal: int().notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
},
  (table) => ({
    transaction_id_fk: foreignKey({
      columns: [table.transaction_id],
      foreignColumns: [transactions.id],
    }),
    product_id_fk: foreignKey({
      columns: [table.product_id],
      foreignColumns: [products.id],
    }),
  })
);

export const purchases = mysqlTable("purchases", {
  id: int().primaryKey().autoincrement(),
  supplier_id: int().notNull(),
  invoice: varchar({ length: 255 }).notNull(),
  purchase_date: datetime(),
  total: int().notNull(),
  user_id: int().notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
},
  (table) => ({
    supplier_id_fk: foreignKey({
      columns: [table.supplier_id],
      foreignColumns: [suppliers.id],
    }),
    user_id_fk: foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
    }),
  })
);

export const purchase_details = mysqlTable("purchase_details", {
  id: int().primaryKey().autoincrement(),
  purchase_id: int().notNull(),
  product_id: int().notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: longtext().notNull(),
  purchase_price: int().notNull(),
  price: int().notNull(),
  quantity: int().notNull(),
  subtotal: int().notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
},
  (table) => ({
    purchase_id_fk: foreignKey({
      columns: [table.purchase_id],
      foreignColumns: [purchases.id],
    }),
    product_id_fk: foreignKey({
      columns: [table.product_id],
      foreignColumns: [products.id],
    }),
  })
);

export const store_settings = mysqlTable("store_settings", {
  id: int().primaryKey().autoincrement(),
  store_name: varchar({ length: 255 }).notNull(),
  address: longtext().notNull(),
  email: varchar({ length: 255 }).notNull(),
  logo: longtext().notNull(),
  tax: int().notNull(),
  created_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: datetime()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const cash_shifts = mysqlTable("cash_shifts", {
  id: int().primaryKey().autoincrement(),
  user_id: int().notNull(),
  start_time: datetime().default(sql`CURRENT_TIMESTAMP`).notNull(),
  end_time: datetime(),
  starting_cash: int().notNull(),
  expected_cash: int(),
  actual_cash: int(),
  difference: int(),
  notes: longtext(),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  created_at: datetime().default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: datetime().default(sql`CURRENT_TIMESTAMP`).notNull(),
},
  (table) => ({
    user_id_fk: foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
    }),
  })
);

export const cash_movements = mysqlTable("cash_movements", {
  id: int().primaryKey().autoincrement(),
  shift_id: int().notNull(),
  user_id: int().notNull(),
  type: mysqlEnum("type", ["in", "out"]).notNull(),
  amount: int().notNull(),
  reason: varchar({ length: 255 }).notNull(),
  created_at: datetime().default(sql`CURRENT_TIMESTAMP`).notNull(),
},
  (table) => ({
    shift_id_fk: foreignKey({
      columns: [table.shift_id],
      foreignColumns: [cash_shifts.id],
    }),
    user_id_fk: foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
    }),
  })
);

