// This script generates a test JWT for local development
const jwt = require('jsonwebtoken');

const secret = 'your_jwt_secret_here'; // Use the value from your backend .env
const payload = { sub: 'testuser' };
const token = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '7d' });
console.log(token);
