const Bill = require('../models').Bill;
const User = require('../models').User;
const File = require('../models').File;
const fs = require('fs');
const { validationResult } = require('express-validator');
const authenticationStatus = require("./usersController").authenticationStatus;
const moment = require('moment');

moment.suppressDeprecationWarnings = true;
//  Bcrypt

const bcrypt = require(`bcrypt`);

module.exports = {
    createBill(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (req.body.owner_id != undefined || req.body.owner_id != null) {
            return res.status(400).send({
                message: "You cannot update bill's owner id!"
            })
        }
        if (req.body.created_ts != undefined || req.body.created_ts != null || req.body.createdAt != undefined || req.body.createdAt != null) {
            return res.status(400).send({
                message: "You cannot update bill's created date and time!"
            })
        }
        if (req.body.updated_ts != undefined || req.body.updated_ts != null || req.body.updatedAt != undefined || req.body.updatedAt != null) {
            return res.status(400).send({
                message: "You cannot uodate bill's update date and time!"
            })
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
                                owner_id: user[0].id,
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
    },

    getBills(req, res) {
        if (!req.headers.authorization) {
            //if no authrization was done, return with response saying needed authorization
            authenticationStatus(res);
            return;
        }
        let authentication = req.headers.authorization.replace(/^Basic/, '');

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
                        message: 'User not Found! Invalid !',

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

                        return Bill
                            .findAll({
                                where: {
                                    owner_id: user[0].dataValues.id
                                }
                            })
                            .then((bills) => {
                                if (bills.length == 0) {
                                    return res.status(404).send({
                                        message: 'Bill not found for the user!',

                                    });
                                }
                                else {
                                    bills.forEach(bill => {
                                        bill.dataValues.created_ts = bill.dataValues.createdAt;
                                        delete bill.dataValues.createdAt;
                                        bill.dataValues.updated_ts = bill.dataValues.updatedAt;
                                        delete bill.dataValues.updatedAt;
                                    })
                                    return res.status(200).send(bills);
                                }
                            })

                    } else {
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })
            .catch((error) => res.status(400).send(error));
    },

    getBill(req, res) {
        if (!req.headers.authorization) {
            //if no authrization was done, return with response saying needed authorization
            authenticationStatus(res);
            return;
        }
        let authentication = req.headers.authorization.replace(/^Basic/, '');

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
                        message: 'User not Found! Invalid !',

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

                        return Bill
                            .findAll({
                                where: {
                                    id: req.params.id
                                }
                            })
                            .then((bills) => {
                                if (bills.length == 0) {
                                    return res.status(404).send({
                                        message: 'Bill not found for the user!',

                                    });
                                }
                                else if (bills[0].dataValues.owner_id != user[0].dataValues.id) {
                                    return res.status(401).send({
                                        message: 'Unauthorized to view this bill!'
                                    });
                                }
                                else {

                                    bills[0].dataValues.created_ts = bills[0].dataValues.createdAt;
                                    delete bills[0].dataValues.createdAt;
                                    bills[0].dataValues.updated_ts = bills[0].dataValues.updatedAt;
                                    delete bills[0].dataValues.updatedAt;

                                    return res.status(200).send(bills[0]);
                                }
                            })
                            .catch((err1) => {
                                if (err1.parent.file == "uuid.c") {
                                    res.status(400).send({
                                        message: "Invalid File Id type: UUID/V4 Passed!"
                                    })
                                }
                                return res.status(400).send(err1);
                            })

                    } else {
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })
            .catch((error) => res.status(400).send(error));
    },

    updateBill(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (req.body.owner_id != undefined || req.body.owner_id != null) {
            return res.status(400).send({
                message: "You cannot update bill's owner id!"
            })
        }
        if (req.body.created_ts != undefined || req.body.created_ts != null || req.body.createdAt != undefined || req.body.createdAt != null) {
            return res.status(400).send({
                message: "You cannot update bill's created date and time!"
            })
        }
        if (req.body.updated_ts != undefined || req.body.updated_ts != null || req.body.updatedAt != undefined || req.body.updatedAt != null) {
            return res.status(400).send({
                message: "You cannot uodate bill's update date and time!"
            })
        }
        if (!req.headers.authorization) {
            //if no authrization was done, return with response saying needed authorization
            authenticationStatus(res);
            return;
        }
        let authentication = req.headers.authorization.replace(/^Basic/, '');

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
                        message: 'User not Found! Invalid !',

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

                        return Bill
                            .findAll({
                                where: {
                                    id: req.params.id
                                }
                            })
                            .then((bills) => {
                                if (bills.length == 0) {
                                    return res.status(404).send({
                                        message: 'Bill not found for the user!',

                                    });
                                }
                                else if (bills[0].dataValues.owner_id != user[0].dataValues.id) {
                                    return res.status(401).send({
                                        message: 'Unauthorized to update this bill!'
                                    });
                                }
                                else {

                                    return Bill
                                        .update({
                                            vendor: req.body.vendor,
                                            bill_date: req.body.bill_date,
                                            due_date: req.body.due_date,
                                            amount_due: req.body.amount_due,
                                            categories: req.body.categories,
                                            paymentStatus: req.body.paymentStatus
                                        },
                                            {
                                                where: { id: req.params.id }
                                            })
                                        .then((bill) => {
                                            res.status(204).send("Updated Successfully!");
                                        })
                                        .catch((error) => res.status(400).send(error));
                                }
                            })
                            .catch((error) => res.status(400).send({
                                message: "Bill not found!"
                            }));

                    } else {
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })
            .catch((error) => res.status(400).send(error));
    },

    deleteBill(req, res) {
        if (!req.headers.authorization) {
            //if no authrization was done, return with response saying needed authorization
            authenticationStatus(res);
            return;
        }
        let authentication = req.headers.authorization.replace(/^Basic/, '');

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
                        message: 'User not Found! Invalid !',

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

                        return Bill
                            .findAll({
                                where: {
                                    id: req.params.id
                                }
                            })
                            .then((bills) => {
                                if (bills.length == 0) {
                                    return res.status(404).send({
                                        message: 'Bill not found for the user!',

                                    });
                                }
                                else if (bills[0].dataValues.owner_id != user[0].dataValues.id) {
                                    return res.status(401).send({
                                        message: 'Unauthorized to delete this bill!'
                                    })
                                }
                                if (bills[0].dataValues.attachment != null) {
                                    File
                                        .findAll({
                                            where: {
                                                id: bills[0].dataValues.attachment
                                            }
                                        })
                                        .then((files) => {
                                            fs.unlink(files[0].dataValues.url, function (err) {
                                                File
                                                    .destroy({
                                                        where: {
                                                            id: bills[0].dataValues.attachment
                                                        }
                                                    })
                                            })
                                        });
                                }

                                return Bill
                                    .destroy({
                                        where: {
                                            id: req.params.id
                                        }
                                    })
                                    .then((rowDeleted) => {
                                        if (rowDeleted === 1) {
                                            res.status(204).send('Deleted successfully');
                                        }
                                    })
                                    .catch((e) => res.status(400).send({
                                        message: "Some Error Occured While Deleting!",
                                        error: e
                                    }))

                            })
                            .catch((error) => res.status(400).send({
                                message: "Bill not found!"
                            }));

                    } else {
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })
            .catch((error) => res.status(400).send({
                message: "User not found"
            }));
    }

}
