const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function createMigrationsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Таблица migrations готова');
  } finally {
    client.release();
  }
}

async function getExecutedMigrations() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map(row => row.filename);
  } finally {
    client.release();
  }
}

async function executeMigration(filename, sql) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    console.log(`✅ Миграция ${filename} выполнена`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Ошибка в миграции ${filename}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  try {
    console.log('🚀 Запуск миграций...');
    
    // Создаем таблицу migrations
    await createMigrationsTable();
    
    // Получаем список выполненных миграций
    const executedMigrations = await getExecutedMigrations();
    console.log('Выполненные миграции:', executedMigrations);
    
    // Читаем файлы миграций
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log('Найденные файлы миграций:', migrationFiles);
    
    // Выполняем новые миграции
    for (const filename of migrationFiles) {
      if (!executedMigrations.includes(filename)) {
        console.log(`📝 Выполняем миграцию: ${filename}`);
        const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
        await executeMigration(filename, sql);
      } else {
        console.log(`⏭️ Миграция ${filename} уже выполнена`);
      }
    }
    
    console.log('🎉 Все миграции выполнены!');
    
  } catch (error) {
    console.error('❌ Ошибка выполнения миграций:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Запускаем миграции
runMigrations();

