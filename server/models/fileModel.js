module.exports = (sequelize, DataTypes) => {
    const File = sequelize.define('File', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      file_name: {
        type: DataTypes.STRING
      },
      url: {
        type: DataTypes.STRING
      },
      upload_date: {
        type: DataTypes.DATEONLY
      },
      size: {
        type: DataTypes.DOUBLE
      },
      fileOwner:{
        type: DataTypes.STRING
      },
      bill:{
        type: DataTypes.UUID
      },
      md5:{
        type: DataTypes.STRING
      }
    }, {
      defaultScope : {
        attributes: { exclude: ['size', 'md5', 'fileOwner', 'createdAt', 'updatedAt'] },
      }
    });
    return File;
  };