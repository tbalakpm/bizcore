import jwt from 'jsonwebtoken';
import { config } from './src/config';

const token = jwt.sign({ userId: 1, email: "admin@example.com" }, config.jwtSecret, { expiresIn: '1h' });
console.log(token);
