var Sequelize = require('sequelize');
const { Pool, Client } = require('pg');

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const port = process.env.DB_PORT;

// const username = 'postgres';
// const password = 'Qwe1Asd2Zxc3';
// const host = 'localhost';
// const dbName = 'cloudassignment';
// const port = 5432;
var sequelize = new Sequelize(dbName, username, password,
    {
        host: host,
        port: port,
        dialect: 'postgres',
        pool: { maxConnections: 5, maxIdleTime: 30},
        language: 'en'
    }

);
const connectionString = 'postgres://' + username + ':' + password + '@' + host + '/postgres';

const init = function (callback) {
    const client = new Client({
        user: username,
        host: host,
        database: dbName,
        password: password,
        port: port,
        dialectOptions:{
            ssl: true
        }
        // connectionString : connectionString
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