const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
  // Railway / Production PostgreSQL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });
} else {
  // Local development: try SQLite, guide user if not installed
  try {
    require('sqlite3');
  } catch {
    console.error('⚠️  sqlite3 not installed. For local dev run:  npm install sqlite3');
    console.error('   Or set DATABASE_URL to use PostgreSQL.');
    process.exit(1);
  }
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false,
  });
}

module.exports = sequelize;
