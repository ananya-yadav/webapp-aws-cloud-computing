const Sequelize = require('sequelize');
const sequelize = require("../config/postgres.js").sequelize;
var User = sequelize.define('users', {
    id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
    },
    first_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    last_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowedNull: false
    },
    email_address: {
        allowNull: false,
        type: Sequelize.STRING
    }
},
{
    updatedAt: 'account_updated',
    createdAt: 'account_created'
});
sequelize.sync();
module.exports = {
    User
}