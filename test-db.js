import db from './utils/db.js'; // ✅ Use correct relative path

(async () => {
  try {
    const [rows] = await db.query('SELECT 1');
    console.log('✅ DB Connection successful:', rows);
  } catch (err) {
    console.error('❌ DB Connection failed:', err);
  } finally {
    await db.end();
  }
})();