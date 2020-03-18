const Sequelize = require('sequelize');
const sequelize = require("../config/postgres.js").sequelize;
let Bill = sequelize.define('bill', {
    id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
    },
    owner_id: {
        allowNull: false,
        type: Sequelize.UUID,
    },
    vendor: {
        allowNull: false,
        type: Sequelize.STRING
    },
    bill_date: {
        allowNull: false,
        type: Sequelize.DATE
    },
    due_date: {
        allowNull: false,
        type: Sequelize.DATE
    },
    amount_due: {
        allowNull: false,
        type: Sequelize.DOUBLE
    },
    categories: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    },
    paymentStatus: {
        allowNull: false,
        type: Sequelize.ENUM('paid', 'due', 'past_due', 'no_payment_required')
    }
},
    {
        updatedAt: 'updated_ts',
        createdAt: 'created_ts'
    })
sequelize.sync();
module.exports = {
    Bill
}