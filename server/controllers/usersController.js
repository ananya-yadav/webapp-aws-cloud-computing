const User = require('../models/userModel').User;
const { validationResult } = require('express-validator');
const LOGGER = require("../logger/logger.js");
const SDC = require('statsd-client');
const sdc = new SDC({ host: 'localhost', port: 8125 });

const uuidv4 = require('uuid/v4');

// BCcypt
const bcrypt = require(`bcrypt`);

module.exports = {
  create(req, res) {
    sdc.increment('CREATE_USER');
    let sDate15 = new Date();
    LOGGER.info("CREATING USER");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return User
      .findAll({
        limit: 1,
        where: {
          email_address: req.body.email_address
        },
      })
      .then(user => {
        if (user.length > 0) {
          return res.status(400).send({
            message: `User exists! Provide a different email.`,
          });
        }

        const password = req.body.password;
        const PassCodeBcrypt = bcrypt.hashSync(password, 8);

        let flag = passwordCheck(res, password);

        if (!flag) {
          let sd1 = new Date();
          return User
            .create({
              id: uuidv4(),
              first_name: req.body.first_name,
              last_name: req.body.last_name,
              email_address: req.body.email_address,
              password: PassCodeBcrypt
            })
            .then((user) => {
              let ed1 = new Date();
              let ms1 = (ed1.getTime() - sd1.getTime());
              sdc.timing('create_user_DBQuery_time', ms1);
              delete user.dataValues.password;
              user.dataValues.account_created = user.dataValues.createdAt;
              delete user.dataValues.createdAt;
              user.dataValues.account_updated = user.dataValues.updatedAt;
              delete user.dataValues.updatedAt;
              let eDate15 = new Date();
              let miliseconds15 = (eDate15.getTime() - sDate15.getTime());
              sdc.timing('create_user_api_time', miliseconds15);

              LOGGER.info("USER HAS BEEN CREATED");
              res.status(201).send(user)
            })

            .catch((error) => res.status(400).send(error));
        }
      })

      .catch((error) => {
        LOGGER.error({ errors: errors.array() });
        res.status(400).send(error);

      });
  },


  getUser(req, res) {
    sdc.increment('GET_USER');
    let sDate16 = new Date();
    LOGGER.info("GET USERS BY SPECIFIC ID");
    // req -> Request Object -> Headers -> Basic Auth with Username & Password -> req.headers.authorization
    // Eg : Basic bsifhdjasz#shbdfiIUHQUhnjdaj123
    if (!req.headers.authorization) {
      //if no authrization was done, return with response saying needed authorization
      authenticationStatus(res);
      return;
    }

    //Remove 'Basic' from authorization header
    let authentication = req.headers.authorization.replace(/^Basic/, '');
    // De-convert authorization token to base64
    //Eg: Ana@gmail.com:myPassword@123
    authentication = (new Buffer(authentication, 'base64')).toString('utf8');
    const loginInfo = authentication.split(':');
    const uName = loginInfo[0];
    const pswd = loginInfo[1];

    console.log(`Username : ${uName} :: ${pswd}`);

    return User.findAll({
      limit: 1,
      where: {
        email_address: uName
      },
    })
      .then((user) => {

        if (user.length == 0) {
          return res.status(404).send({
            message: 'User Not Found! Invalid !',

          });
        }
        console.log(`req.body.password : ${req.body.password} :: user[0].dataValues.password : ${user[0].dataValues.password}`)

        //Check password from header authorization with the database bcrypt encrypted password
        bcrypt.compare(pswd, user[0].dataValues.password, function (err, res2) {
          if (err) {
            return res.status(400).send({
              message: 'Error occured while comparing passwords.'
            })
          }
          if (res2) {

            delete user[0].dataValues.password;
            user[0].dataValues.account_created = user[0].dataValues.createdAt;
            delete user[0].dataValues.createdAt;
            user[0].dataValues.account_updated = user[0].dataValues.updatedAt;
            delete user[0].dataValues.updatedAt;
            LOGGER.info("GET USER");

            let eDate16 = new Date();
            let miliseconds16 = (eDate16.getTime() - sDate16.getTime());
            sdc.timing('get_user_api_time', miliseconds16);
            return res.status(200).send(user[0]);

          } else {
            return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
          }
        });
      })
      .catch((error) => {
        res.status(400).send(error);
        LOGGER.error({ errors: errors.array() });

      });
  },





  update(req, res) {
    sdc.increment('UPDATE_USER');
    let sDate17 = new Date();
    LOGGER.info("USER BEING UPDATED");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.headers.authorization) {
      authenticationStatus(res);
      return;
    }

    let authentication = req.headers.authorization.replace(/^Basic/, '');
    authentication = (new Buffer(authentication, 'base64')).toString('utf8');
    const loginInfo = authentication.split(':');
    const uName = loginInfo[0];
    const pswd = loginInfo[1];

    console.log(`Username : ${uName} :: ${pswd}`);


    return User
      .findAll({
        limit: 1,
        where: {
          email_address: uName
        },
      })
      .then((user) => {
        if (user.length == 0) {
          return res.status(404).send({
            message: 'User Not Found! Invalid Username!',
          });
        }
        if (uName != req.body.email_address) {
          return res.status(400).send({
            message: 'Cannot change your email_address.'
          })
        }
        console.log(`req.body.password : ${req.body.password} :: user[0].dataValues.password : ${user[0].dataValues.password}`)
        bcrypt.compare(pswd, user[0].dataValues.password, function (err, res2) {
          if (err) {
            return res.status(400).send({
              message: 'Error occured while comparing passwords.'
            })
          }
          if (res2) {
            console.log(`Test ---------------`);
            bcrypt.hash(req.body.password, 5).then(function (hash) {
              let flag = passwordCheck(res, req.body.password);
              if (!flag) {
                return User
                  .update({
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    password: hash
                  },
                    {
                      where: { email_address: uName }
                    })
                  .then((user) => {
                    let eDate17 = new Date();
                    let miliseconds17 = (eDate17.getTime() - sDate17.getTime());
                    sdc.timing('UPDATE_USER', miliseconds17);
                    LOGGER.info("USER UPDATED");
                    res.status(204).send("Updated Successfully!");
                  })
                  .catch((error) => res.status(400).send(error));
              }
            })

          } else {
            LOGGER.error({ errors: errors.array() });
            return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
          }
        });
      })
      .catch((error) => {
        LOGGER.error({ errors: errors.array() });

        res.status(400).send(error);
      });
  }
};

const realm = 'Basic Authentication';

function authenticationStatus(resp) {
  resp.writeHead(401, { 'WWW-Authenticate': 'Basic realm="' + realm + '"' });
  resp.end('Basic Authorization is needed! Provide Username and Password!');
};

function passwordCheck(res, password) {
  const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
  let flag = false;
  if (password.length <= 8) {
    res.status(403).send({
      message: 'Weak Password : Length should be more than 8 characters',
    });
    flag = true;
  }
  else if (/^[a-zA-Z]+$/.test(password)) {
    res.status(403).send({
      message: 'Weak Password :  Must Contain at least 1 -> lowercase char, uppercase char, 1 numeric char and 1 special char & length grater than 8',
    });
    flag = true;
  } else if (!strongRegex.test(password)) {
    res.status(403).send({
      message: 'Weak Password : Must Contain at least 1 -> lowercase char, uppercase char, 1 numeric char and 1 special char & length grater than 8',
    });
    flag = true;
  }
  return flag;
}