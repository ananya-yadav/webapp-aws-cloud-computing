const userController = require('../controllers').users;
const fileController = require('../controllers').files;
const billController = require('../controllers').bills;
const { check } = require('express-validator');
const { body } = require('express-validator');

module.exports = (app) => {
  app.get('/v1', (req, res) => res.status(200).send({
    message: 'Network Structure & Cloud Computing (Spring 2020)',
  }));
  app.get('/v1/user/self', userController.getUser);

  app.put('/v1/user/self', [check('email_address').exists().isEmail(), check('first_name').exists().isLength({ min: 1, max: 100 }),
  check('last_name').exists().isLength({ min: 1, max: 100 }), check('password').exists()], userController.update);

  app.post('/v2/user', [check('email_address').exists().isEmail(), check('first_name').exists().isLength({ min: 1, max: 100 }),
  check('last_name').exists().isLength({ min: 1, max: 100 }), check('password').exists()], userController.create);


  app.get('/v1/bills', billController.getBills);
  app.get('/v1/bill/:id', billController.getBill);
  app.put('/v1/bill/:id', body('paymentStatus').custom((value, { req }) => {

    if (value !== "paid" && value !== "due" && value !== "past_due" && value !== "no_payment_required") {
      throw new Error(`Payment Status must be 'paid', 'due', 'past_due' or 'no_payment_required'`);
    }
    return true;
  }), [check('vendor').exists(), check('bill_date').exists(), check('due_date').exists(),
  check('amount_due').exists().isNumeric(), check('categories').exists().isArray(), check('attachment').not().exists()], billController.updateBill);
  app.delete('/v1/bill/:id', billController.deleteBill);
  app.post('/v1/bill', body('paymentStatus').custom((value, { req }) => {

    if (value !== "paid" && value !== "due" && value !== "past_due" && value !== "no_payment_required") {
      throw new Error(`Payment Status must be 'paid', 'due', 'past_due' or 'no_payment_required'`);
    }
    return true;
  }), [check('vendor').exists(), check('bill_date').exists(), check('due_date').exists(),
  check('amount_due').exists().isNumeric(), check('categories').exists().isArray(), check('attachment').not().exists()], billController.createBill);

  // Files

  app.post('/v1/bill/:id/file', fileController.createFile);
  app.get('/v1/bill/:billId/file/:fileId', fileController.getFile);
  app.delete('/v1/bill/:billId/file/:fileId', fileController.deleteFile);

  //number of days

  app.get('/v1/bills/due/:x', billController.getBillsWhichAreDue);



};
