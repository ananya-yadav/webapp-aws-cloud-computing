 module.exports = {
    up: (queryInterface, Sequelize) =>
      queryInterface.createTable('Bills', {
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
          type: Sequelize.DATEONLY
        },
        due_date: {
          type: Sequelize.DATEONLY
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
            type: Sequelize.ARRAY(Sequelize.STRING)
        },
        paymentStatus: {
            type: Sequelize.ENUM('paid', 'due', 'past_due', 'no_payment_required')
        },
        attachment:{
          type:Sequelize.UUID,
          references:{
              model:'Files',
              key:'id'
          }
      }
      
      }),
    down: (queryInterface /* , Sequelize */) => queryInterface.dropTable('Bills'),
  };
  