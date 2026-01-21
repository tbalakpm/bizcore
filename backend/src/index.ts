import { app } from './app';
import { config } from './config';

app()
  .then((server) => {
    server.listen(config.port, () => {
      console.log(`Server (api) listening on http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });
