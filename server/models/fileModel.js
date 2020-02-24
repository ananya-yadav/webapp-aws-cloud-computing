const Sequelize = require('sequelize');
const sequelize = require("../config/postgres.js").sequelize;
var Files = sequelize.define('attachments', {
  id: {
    allowNull: false,
    type: Sequelize.UUID,
    primaryKey: true
  },
  bill: {
    type: Sequelize.UUID
  },
  file_name: {
    type: Sequelize.STRING
  },
  url: {
    type: Sequelize.STRING
  },
  md5: {
    type: Sequelize.STRING
  },
  size: {
    type: Sequelize.INTEGER
  }
},
  {
    timestamps: true,
    updatedAt: false,
    createdAt: 'upload_date'
  });
sequelize.sync();
module.exports = {
  Files
}
