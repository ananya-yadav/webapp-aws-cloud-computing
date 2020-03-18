const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');

const app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const props = require("./server/config/postgres.js");
const path = require("path");

props.init(function (req, res) {

  const userModel = require(path.resolve(".") + "/server/models/userModel").User;
  const billsModel = require(path.resolve(".") + "/server/models/bill").Bill;
  const fileModel = require(path.resolve(".") + "/server/models/fileModel").Files;

  userModel.hasMany(billsModel, { as: 'bills', foreignKey: 'owner_id' })
  billsModel.hasOne(fileModel, { foreignKey: 'bill', onDelete: 'CASCADE' });
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  
  process.on('unhandledRejection', (err, p) => {
    console.log(`Rejection: ${err}`);
  });

  require('./server/routes')(app);
  app.get('*', (req, res) => res.status(200).send({
    message: 'Network Structure & Cloud Computing (Spring 2020)',
  }));
})



module.exports = app;
