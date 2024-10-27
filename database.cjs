const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // You will set this in the environment variables
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;