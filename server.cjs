require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const next = require('next');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const pool = require('./database.cjs');
const uuid = require('uuid');
const qr = require('qr-image');
const { auth, requiresAuth } = require('express-openid-connect');

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3000;
const app = next({ dev, port });
const handle = app.getRequestHandler();
const server = express();

server.use(bodyParser.json());

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,                     
      rateLimit: true,                  
      jwksRequestsPerMinute: 5,
      jwksUri: 'https://dev-vvabkcp1b4m6r582.eu.auth0.com/.well-known/jwks.json'
    }),

    audience: 'https://dev-vvabkcp1b4m6r582.eu.auth0.com/api/v2/',
    issuer: 'https://dev-vvabkcp1b4m6r582.eu.auth0.com/',
    algorithms: ['RS256']
});

const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: process.env.BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    secret: process.env.AUTH0_SECRET,
    authorizationParams: {
        redirect_uri: `${process.env.BASE_URL}`
    }
};

server.use(auth(config));

async function createTicketsTable() {
    console.log('Creating table...');
    const query = `
        CREATE TABLE IF NOT EXISTS tickets (
            id SERIAL PRIMARY KEY,
            uuid VARCHAR(36) NOT NULL,
            oib VARCHAR(11) NOT NULL,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    try {
        await pool.query(query);
        console.log('Table created successfully');
    } catch (error) {
        console.error('Error creating table:', error);
    }
}

createTicketsTable();

server.get('/me', requiresAuth(), (req, res) => {
    res.json(req.oidc.user);
});

server.get('/tickets_count/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tickets');
        return res.status(200).json(result.rows.length);
    } catch (error) {
        console.error('Error getting tickets:', error);
        return res.status(500).send('Server error');
    }
});

server.get('/tickets_count', async (req, res) => {
    try {
        return app.render(req, res, '/tickets_count', req.query);
    } catch (error) {
        return res.status(500).send('Server error');
    }
});

server.post('/generate-ticket', checkJwt, async (req, res) => {
    const { oib, firstName, lastName } = req.body;

    if (!oib || !firstName || !lastName) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const count = await pool.query('SELECT COUNT(*) FROM tickets WHERE oib = $1', [oib]);
        if (parseInt(count.rows[0].count) >= 3) {
            return res.status(400).send('Maximum number of tickets reached');
        }

        const ticketId = uuid.v4();
        const result = await pool.query(
          'INSERT INTO tickets (uuid, oib, first_name, last_name) VALUES ($1, $2, $3, $4)',
          [ticketId, oib, firstName, lastName]
        );

        const qrData = `${process.env.BASE_URL}/tickets/${ticketId}`;
        console.log("QR data:", qrData);

        const qrCode = qr.imageSync(qrData, { type: 'png' });

        console.log("Ticket generated!");
        res.type('png');
        return res.status(201).json(qrCode);
    } 
    catch (error) {
        console.error('Error generating ticket:', error);
        return res.status(500).send('Server error');
    }
});

server.get('/tickets/:ticketId/data', requiresAuth(), async (req, res) => {
    if (!req.oidc.isAuthenticated()) {
        return res.render('/login');
    }

    const { ticketId } = req.params;
    console.log("Ticket ID:", ticketId);
    try {
        const result = await pool.query('SELECT * FROM tickets WHERE uuid = $1', [ticketId]);
        if (result.rows.length === 0) {
            return res.status(404).send('Ticket not found');
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error getting ticket:', error);
        return res.status(500).send('Server error');
    }
});

server.get('/tickets/:ticketId', requiresAuth(), async (req, res) => {
    if (!req.oidc.isAuthenticated()) {
        return res.render('/login');
    }

    const { ticketId } = req.params;
    console.log("Ticket ID:", ticketId);
    try {
        res.redirect(`/tickets?id=${ticketId}`);
    } catch (error) {
        console.error('Error getting tickets:', error);
        return res.status(500).send('Server error');
    }
});

app.prepare().then(() => {
    server.get('/', (req, res) => {
        if (req.oidc.isAuthenticated()) {
            console.log("User logged:", req.oidc.user);
        }
        else {
            console.log("User not logged");
        }
        return app.render(req, res, '/', req.query);
    });

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.use((err, req, res, next) => {
        if (err.name === 'UnauthorizedError') {
            res.status(401).send('Unauthorized: Invalid token');
        }
        next();
    });

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on port: ${port}`);
    });
});