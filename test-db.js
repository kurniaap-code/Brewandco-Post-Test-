// test-db.js
const mysql = require('mysql2');

// Ganti dengan data dari Railway
const connection = mysql.createConnection({
  host: 'tokaido.proxy.rlwy.net',
  user: 'root',
  password: 'RxtOhpPQfnpalZSiyblzTJfrnVUVMTrr',
  database: 'railway',
  port: 22857
});

console.log('🔍 Mencoba konek ke Railway...');
console.log(`   Host: tokaido.proxy.rlwy.net:22857`);
console.log(`   Database: railway`);

connection.connect((err) => {
  if (err) {
    console.error('❌ Gagal konek ke Railway:');
    console.error('   Error:', err.message);
    console.error('   Code:', err.code);
    console.error('\n💡 Kemungkinan penyebab:');
    console.error('   1. Password salah');
    console.error('   2. Host/port salah');
    console.error('   3. Database tidak bisa diakses dari luar');
    process.exit(1);
  }
  
  console.log('✅ Berhasil konek ke Railway!');
  
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('❌ Query error:', err.message);
    } else {
      console.log('📋 Data users:');
      console.table(results);
    }
    connection.end();
  });
});