const userController = require('../controllers').users;
const billController = require('../controllers').bills;
const { check } = require('express-validator');


module.exports = (app) => {
  app.get('/v1', (req, res) => res.status(200).send({
    message: 'Network Structure & Cloud Computing (Spring 2020)',
  }));
  app.get('/v1/user/self', userController.getUser);

  app.put('/v1/user/self', [check('email_address').exists().isEmail(), check('first_name').exists().isLength({min: 1, max: 100}), 
  check('last_name').exists().isLength({min:1, max:100}), check('password').exists()], userController.update);
  
  app.post('/v1/user', [check('email_address').exists().isEmail(), check('first_name').exists().isLength({min: 1, max: 100}), 
      check('last_name').exists().isLength({min:1, max:100}), check('password').exists()], userController.create);
      
      
  app.get('/v1/bills', billController.getBills);
  app.get('/v1/bill/:id',billController.getBill);
  // app.put('/v1/bills/{id}', billController.updateBill);
  // app.delete('/v1/bills/{id}', billController.deleteBill);
     app.post('/v1/bill',[check('vendor').exists(),check('bill_date').exists(),check('due_date').exists(),
         check('amount_due').exists(),check('categories').exists()], billController.createBill);



};