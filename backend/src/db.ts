import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from './config';

const client = createClient({
  url: TURSO_DATABASE_URL!,
  authToken: TURSO_AUTH_TOKEN!,
});

export const initializeDatabase = async () => {
  // You can add any initialization logic here if needed
  await client.execute(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`);

  await client.execute(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    type CHAR NOT NULL,
    user_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(name, user_id)
  );`);

  await client.execute(`
  CREATE TABLE IF NOT EXISTS registers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    amount REAL,
    date TEXT,
    category_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(name, user_id)
  );`);

  await client.execute(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    register_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (register_id) REFERENCES registers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`);

  console.log('Database initialized');
};

export const db = drizzle(client, { logger: true, casing: 'snake_case' });

// import { Sequelize } from "sequelize";
// import { DB_FILE } from "./config";
// import { Category, initCategoryModel } from "./models/Category";
// import { Entry, initEntryModel } from "./models/Entry";
// import { initRegisterModel, Register } from "./models/Register";
// import { initUserModel, User } from "./models/User";

// export const sequelize = new Sequelize({
//   dialect: "sqlite",
//   storage: DB_FILE,
//   pool: { min: 1, max: 100, idle: Infinity },
//   logging: (msg: string) => console.log("Sequelize:", msg), // Custom logging function
// });

// export const initializeDatabase = async () => {
//   try {
//     // Test the database connection
//     await sequelize.authenticate();

//     // Run PRAGMA statements to optimize SQLite performance
//     await sequelize.query("PRAGMA foreign_keys = ON;"); // Enable FK constraints
//     await sequelize.query("PRAGMA journal_mode = WAL;"); // Write-Ahead Logging
//     await sequelize.query("PRAGMA synchronous = NORMAL;"); // Balance between performance and durability
//     await sequelize.query("PRAGMA case_sensitive_like = OFF;"); // Case-sensitive LIKE operations

//     // Initialize models
//     initUserModel(sequelize);
//     initCategoryModel(sequelize);
//     initRegisterModel(sequelize);
//     initEntryModel(sequelize);

//     // Define associations
//     User.hasMany(Category);
//     User.hasMany(Register);
//     User.hasMany(Entry);

//     Category.belongsTo(User);
//     Category.hasMany(Register);

//     Register.belongsTo(Category);
//     Register.belongsTo(User);
//     Register.hasMany(Entry);

//     Entry.belongsTo(Register);
//     Entry.belongsTo(User);

//     // Sync models with the database
//     await sequelize.sync();

//     console.log("Connection has been established successfully.");
//   } catch (error) {
//     console.error("Unable to connect to the database:", error);
//   }
// };
