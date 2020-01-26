const Bill = require('../models').Bill;
const User = require('../models').User;
const { validationResult } = require('express-validator');
const authenticationStatus = require("./usersController").authenticationStatus;
//  Bcrypt

const bcrypt = require(`bcrypt`);

module.exports = {
    createBill(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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
                console.log(`req.body.password : ${req.body.password} :: user[0].dataValues.password : ${user[0].dataValues.password}`)
                bcrypt.compare(pswd, user[0].dataValues.password, function (err, res2) {
                    if (err) {
                        return res.status(400).send({
                            message: 'Error occured while comparing passwords.'
                        })
                    }
                    if (res2) {
                        return Bill
                            .create({
                                owner_id : user[0].id,
                                vendor: req.body.vendor,
                                bill_date: req.body.bill_date,
                                due_date: req.body.due_date,
                                amount_due: req.body.amount_due,
                                categories: req.body.categories,
                                paymentStatus: req.body.paymentStatus
                            })
                            .then((bill) => {
                                bill.dataValues.created_ts = bill.dataValues.createdAt;
                                delete bill.dataValues.createdAt;
                                bill.dataValues.updated_ts = bill.dataValues.updatedAt;
                                delete bill.dataValues.updatedAt;
                                res.status(201).send(bill)
                            })
                            .catch((error) => res.status(400).send(error));

                    } else {
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })
            .catch((error) => res.status(400).send(error));
    }
}
