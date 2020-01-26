module.exports = {
    up: (queryInterface, Sequelize) =>
      queryInterface.createTable('Bill', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
        },
        owner_id: {
            allowNull: false,
            type: Sequelize.UUID,
          },
        vendor: {
          type: Sequelize.STRING
        },
        bill_date: {
          type: Sequelize.DATE
        },
        due_date: {
          type: Sequelize.DATE
        },
        amount_due: {
          allowNull: false,
          type: Sequelize.DOUBLE
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        categories: {
            type: Sequelize.ARRAY(DataTypes.STRING)
        },
        paymentStatus: {
            type: Sequelize.ENUM('paid', 'due', 'past_due', 'no_payment_required')
        },
      }),
    down: (queryInterface /* , Sequelize */) => queryInterface.dropTable('Bill'),
  };
  