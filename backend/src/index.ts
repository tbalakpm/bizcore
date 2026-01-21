import { start } from './server';

start()
  .then(() => {
    console.log('Server started successfully');
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });
