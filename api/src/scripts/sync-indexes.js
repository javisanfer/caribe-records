// scripts/sync-indexes.js
require('dotenv').config();
const mongoose = require('mongoose');

// importa tus modelos para que se registren
require('../src/models/artist.model');
require('../src/models/editorial.model');
require('../src/models/event.model');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/caribe_records';
  await mongoose.connect(uri);

  const models = ['Artist', 'Editorial', 'Event'];
  for (const name of models) {
    const m = mongoose.model(name);
    console.log(`🔧 syncIndexes -> ${name}`);
    await m.syncIndexes();
  }

  await mongoose.disconnect();
  console.log('✅ Índices sincronizados');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});