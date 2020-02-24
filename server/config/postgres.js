var Sequelize = require('sequelize');
const { Pool, Client } = require('pg');
var sequelize = new Sequelize('assignments', 'postgres', 'Neuananya@17',
    {
        host: 'localhost',
        dialect: 'postgres'
    }

);
const username = 'postgres';
const password = 'Neuananya@17';
const host = 'localhost';
const dbName = 'assignments';
const connectionString = 'postgres://' + username + ':' + password + '@' + host + '/postgres';

const init = function (callback) {
    const client = new Client({
        connectionString: connectionString
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