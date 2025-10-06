const fs = require('fs');
const path = require('path');

function createMigration() {
  const migrationName = process.argv[2];
  
  if (!migrationName) {
    console.error('❌ Укажите название миграции:');
    console.log('Пример: node src/scripts/create-migration.js add_new_column');
    process.exit(1);
  }
  
  // Получаем следующий номер миграции
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const existingFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  const nextNumber = existingFiles.length + 1;
  const paddedNumber = nextNumber.toString().padStart(3, '0');
  const filename = `${paddedNumber}_${migrationName}.sql`;
  const filepath = path.join(migrationsDir, filename);
  
  // Создаем шаблон миграции
  const template = `-- Миграция: ${migrationName}
-- Дата создания: ${new Date().toISOString()}

-- ВАЖНО: Всегда создавайте обратную миграцию!
-- Для отката используйте: node src/scripts/rollback.js

-- Ваш SQL код здесь
-- Пример:
-- ALTER TABLE books ADD COLUMN new_field VARCHAR(255);

-- Не забудьте добавить комментарии:
-- COMMENT ON COLUMN books.new_field IS 'Описание нового поля';
`;

  fs.writeFileSync(filepath, template);
  console.log(`✅ Создана миграция: ${filename}`);
  console.log(`📁 Путь: ${filepath}`);
  console.log('📝 Отредактируйте файл и запустите: npm run migrate');
}

createMigration();

