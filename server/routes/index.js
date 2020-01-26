const userController = require('../controllers').users;
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
};