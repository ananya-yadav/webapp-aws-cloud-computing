
module.exports = (sequelize, DataTypes) => {
    const Bill = sequelize.define('Bill', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        owner_id: {
            allowNull: false,
            type: DataTypes.UUID
        },
        bill_date: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        due_date: {
            allowNull: false,
            type: DataTypes.DATEONLY
        },
        amount_due: {
            allowNull: false,
            type: DataTypes.DOUBLE,
            validate :{
                min : 0.01
            }

        },
        vendor: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        categories: {
            type: DataTypes.ARRAY(DataTypes.STRING)
        },
        paymentStatus: {
            type: DataTypes.ENUM('paid', 'due', 'past_due', 'no_payment_required')
        }

    });
    return Bill;
};
