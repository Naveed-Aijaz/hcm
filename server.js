// Local / traditional-host entry point. On Vercel, api/index.js is used instead.
import 'dotenv/config';
import app from './app.js';
import connectDB from './src/config/db.js';

const PORT = Number(process.env.PORT) || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`HCM Lite API running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
