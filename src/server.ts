import app from './app';
import config from './config/config';
import initDB from './DB/db';

const port = config.port;

const startServer = async () => {
  try {
    await initDB();
    console.log('Database initialized successfully');
    app.listen(port, () => {
      console.log(`Rentify is running on port: ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize database', error);
    process.exit(1);
  }
};

startServer();
