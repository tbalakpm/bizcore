import { app } from './src/app';
import http from 'http';

(async () => {
  const { express, port } = await app();
  const server = http.createServer(express);
  server.listen(0, async () => {
    const address = server.address() as any;
    const testPort = address.port;
    console.log(`Test server listening on port ${testPort}`);

    // We can't easily test auth here without a token, 
    // but maybe we can just see if the code compiles and initializes.
    console.log("Backend initialized successfully");
    process.exit(0);
  });
})();
