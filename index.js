const express = require('express');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
app.get('/', (req, res) => {
    res.send( 'Servidor is running!' );
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

