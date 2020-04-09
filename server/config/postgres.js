var Sequelize = require('sequelize');
const { Pool, Client } = require('pg');

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const port = process.env.DB_PORT;
const fs = require('fs');
const location = process.env.CERT_DIR;
const certificate = fs.readFileSync( location + "rds-combined-ca-bundle.pem");

var sequelize = new Sequelize(dbName, username, password,
    {
        host: host,
        port: port,
        dialect: 'postgres',
        pool: { maxConnections: 5, maxIdleTime: 30},
        language: 'en'
    }

);

const init = function (callback) {
    const client = new Client({
        user: username,
        host: host,
        database: dbName,
        password: password,
        port: port,
        dialectOptions: {
            ssl: {
                rejectUnauthorized: true,
                ca: [certificate]
            }
        }
    })

    client.connect();
    client.query('CREATE DATABASE ' + dbName, function (err) {
        callback(null);
        client.end();
    })
}

module.exports = {
    sequelize, init
}