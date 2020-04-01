const Bill = require("../models/bill").Bill;
const File = require("../models/fileModel").Files;
const User = require('../models/userModel').User;
const fs = require('fs');
const { validationResult } = require('express-validator');
const authenticationStatus = require("./usersController").authenticationStatus;
const moment = require('moment');
Bill.hasOne(File, { foreignKey: 'bill', onDelete: 'CASCADE' });

moment.suppressDeprecationWarnings = true;
//  Bcrypt

const bcrypt = require(`bcrypt`);

const uuidv4 = require('uuid/v4');
const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const bucket = process.env.S3_BUCKET;

//LOGGER

const LOGGER = require("../logger/logger.js");
const SDC = require('statsd-client');
const sdc = new SDC({ host: 'localhost', port: 8125 });


const awsQueueUrl = process.env.My_QUEUE;
const { Op } = require('sequelize');
const awsRegion = process.env.AWS_REGION;
aws.config.update({region : awsRegion});

// Create an SQS service object
var sqs = new aws.SQS({apiVersion: '2012-11-05'});

module.exports = {
    getBillsWhichAreDue(req, res) {
        sdc.increment('get_bills_which_are_due');
        let sDate5 = new Date();
        let days = req.params.x;
        LOGGER.info("Get bills by number of days");
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
            }

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
                        let sD2 = new Date();
                        return Bill
                            .findAll({
                                where: {
                                    owner_id: user[0].dataValues.id,
                                    due_date: {
                                        [Op.lte]: moment().add(days, 'days').toDate(),
                                        [Op.gte]: moment().format()
                                    }
                                },
                                include: File

                            })
                            .then((bills) => {
                                let eD2 = new Date();
                                let miliseconds2 = (eD2.getTime() - sD2.getTime());
                                sdc.timing('get_bills_which_are_due_DBQuery_time', miliseconds2);

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
                                        if (bill.dataValues.attachment != null) {
                                            delete bill.dataValues.attachment.dataValues.size;
                                            delete bill.dataValues.attachment.dataValues.bill;
                                            delete bill.dataValues.attachment.dataValues.md5;
                                        } else {
                                            bill.dataValues.attachment = null;

                                        }

                                    })
                                    let messageJSONBody = {
                                        message : bills,
                                        email_id : user.dataValues.email_address
                                    }

                                    //  SQS  Params
                                    let sqsParams = {
                                        DelaySeconds: 10,
                                        MessageBody: JSON.stringify(messageJSONBody),
                                        QueueUrl: awsQueueUrl
                                    };

                                    //Send Message to SQS
                                    sqs.sendMessage(sqsParams, function (err, data) {
                                        if (err) {
                                            LOGGER.error("SQS Error : ", err);
                                        } else {
                                            LOGGER.debug("SQS Success : ", data.MessageId);
                                        }
                                    });
                                    let eDate5 = new Date();
                                    let miliseconds5 = (eDate5.getTime() - sDate5.getTime());
                                    sdc.timing('get_bills_which_are_due_api_time', miliseconds5);
                                    return res.status(200).send(bills);
                                }


                            })

                    } else {
                        LOGGER.error({ errors: errors.array() });
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })

            .catch((error) => res.status(400).send(error));
    },
    createBill(req, res) {
        sdc.increment('create_bill');
        let sDate8 = new Date();
        LOGGER.info("BILL IS BEING CREATED")
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            LOGGER.error({ errors: errors.array() });
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
                message: "You cannot update bill's update date and time!"
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
                        billData = req.body;
                        billData.id = uuidv4();
                        billData.owner_id = user[0].id;
                        let sD1 = new Date();
                        return Bill
                            .create(billData)
                            .then((bill) => {
                                let eD1 = new Date();
                                let miliseconds1 = (eD1.getTime() - sD1.getTime());
                                sdc.timing('create_bill_DBQuery_time', miliseconds1);
                                bill.dataValues.created_ts = bill.dataValues.createdAt;
                                delete bill.dataValues.createdAt;
                                bill.dataValues.updated_ts = bill.dataValues.updatedAt;
                                delete bill.dataValues.updatedAt;
                                let eDate8 = new Date();
                                let miliseconds8 = (eDate8.getTime() - sDate8.getTime());
                                sdc.timing('create_bill_api_time', miliseconds8);
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
        sdc.increment('get_bill');
        let sDate5 = new Date();
        LOGGER.info("Get bills by ID");
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
            }

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
                        let sD2 = new Date();
                        return Bill
                            .findAll({
                                where: {
                                    owner_id: user[0].dataValues.id
                                },
                                include: File

                            })
                            .then((bills) => {
                                let eD2 = new Date();
                                let miliseconds2 = (eD2.getTime() - sD2.getTime());
                                sdc.timing('get_bill_DBQuery_time', miliseconds2);

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
                                        if (bill.dataValues.attachment != null) {
                                            delete bill.dataValues.attachment.dataValues.size;
                                            delete bill.dataValues.attachment.dataValues.bill;
                                            delete bill.dataValues.attachment.dataValues.md5;
                                        } else {
                                            bill.dataValues.attachment = null;

                                        }

                                    })
                                    let eDate5 = new Date();
                                    let miliseconds5 = (eDate5.getTime() - sDate5.getTime());
                                    sdc.timing('get_bill_api_time', miliseconds5);
                                    return res.status(200).send(bills);
                                }
                            })

                    } else {
                        LOGGER.error({ errors: errors.array() });
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })

            .catch((error) => res.status(400).send(error));
    },

    getBill(req, res) {
        sdc.increment('get_bill_by_ID');
        let sDate10 = new Date();
        LOGGER.info("BILL IS BEING CREATED");
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
                        let sD3 = new Date();
                        return Bill
                            .findAll({
                                where: {
                                    id: req.params.id
                                },

                                include: File
                            })
                            .then((bills) => {
                                let eD3 = new Date();
                                let miliseconds3 = (eD3.getTime() - sD3.getTime());
                                sdc.timing('get_bill_DBQuery_time', miliseconds3);

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
                                    if (bills[0].dataValues.attachment != null) {
                                        delete bills[0].dataValues.attachment.dataValues.md5;
                                        delete bills[0].dataValues.attachment.dataValues.size;
                                        delete bills[0].dataValues.attachment.dataValues.bill;
                                    }
                                    else {
                                        bills[0].dataValues.attachment = null;

                                    }
                                    let eDate10 = new Date();
                                    let miliseconds10 = (eDate10.getTime() - sDate10.getTime());
                                    sdc.timing('get_bill_api_time', miliseconds10);
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
                        LOGGER.error({ errors: errors.array() });
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })

            .catch((error) => {
                LOGGER.error({ errors: errors.array() });
                res.status(400).send(error);
            });
    },

    updateBill(req, res) {
        sdc.increment('get_bill_by_ID');
        let sDate11 = new Date();
        LOGGER.info("UPDATING THE BILL");
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
                                    let sD4 = new Date();
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
                                            let eD4 = new Date();
                                            let milisecond4 = (eD4.getTime() - sD4.getTime());
                                            sdc.timing('get_bill_by_ID_DBQuery_time', milisecond4);
                                            let eDate11 = new Date();
                                            let miliseconds11 = (eDate11.getTime() - sDate11.getTime());
                                            sdc.timing('get_bill_by_ID_api_time', miliseconds11);

                                            LOGGER.info("Bill updated !!");
                                            res.status(204).send("Updated Successfully!");
                                        })
                                        .catch((error) => res.status(400).send(error));
                                }
                            })
                            .catch((error) => res.status(400).send({
                                message: "Bill not found!"
                            }));

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
    },

    deleteBill(req, res) {
        sdc.increment('delete_bill_by_ID');
        let sDate12 = new Date();
        LOGGER.info("DELETING THE BILL");
        let startDate = new Date();
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
                                },
                                include: File
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
                                    LOGGER.info("-------------(bills[0].dataValues.attachment-----------------")
                                    LOGGER.info(bills[0].dataValues.attachment);

                                    LOGGER.info("-------------(bills[0].dataValues.attachment.dataValues.id-----------------")
                                    LOGGER.info(bills[0].dataValues.attachment.dataValues.id);
                                    File
                                        .findAll({
                                            where: {
                                                id: bills[0].dataValues.attachment.dataValues.id
                                            }
                                        })
                                        .then((files) => {
                                            let sDate13 = new Date();
                                            s3.deleteObject({
                                                Bucket: bucket,
                                                Key: files[0].dataValues.key
                                            }, function (err09) {
                                                let eDate13 = new Date();
                                                let miliseconds13 = (eDate13.getTime() - sDate13.getTime());
                                                sdc.timing('delete_bill_by_ID_S3_Bucket_Time', miliseconds13);
                                                if (err09) {
                                                    LOGGER.error("S3 Delete Error :: err09 : " + err09);
                                                    return res.status(400).send({
                                                        message: "Error while deleting from S3!"
                                                    })
                                                } else {
                                                    return File
                                                        .destroy({
                                                            where: {
                                                                id: bills[0].dataValues.attachment.dataValues.id
                                                            }
                                                        })
                                                        .then((rowDeleted) => {
                                                            let sDate14 = new Date();
                                                            return Bill
                                                                .destroy({
                                                                    where: {
                                                                        id: req.params.id
                                                                    }
                                                                })
                                                                .then((rowDeleted) => {
                                                                    let eDate14 = new Date();
                                                                    let miliseconds14 = (eDate14.getTime() - sDate14.getTime());
                                                                    sdc.timing('deleteBillByID_DBQueryTime', miliseconds14);
                                                                    if (rowDeleted === 1) {
                                                                        let endDate = new Date();
                                                                        let seconds = (endDate.getTime() - startDate.getTime());
                                                                        sdc.timing('successfulDeleteBillByID_APICallTime', seconds);
                                                                        LOGGER.info("Bill Deleted Successfuuly");
                                                                        let eDate12 = new Date();
                                                                        let miliseconds12 = (eDate12.getTime() - sDate12.getTime());
                                                                        sdc.timing('get_bill_by_ID_api_time', miliseconds12);
                                                                        res.status(204).send('Deleted successfully');
                                                                    }
                                                                })
                                                                .catch((e) => {
                                                                    LOGGER.error({ "Error": e })
                                                                    res.status(400).send({
                                                                        message: "Some Error Occured While Deleting!",
                                                                        error: e
                                                                    })
                                                                })
                                                        })
                                                        .catch((error2) => {
                                                            LOGGER.error("File Deleted Error :: error2 : " + error2);
                                                            res.status(400).send(error2);
                                                        });
                                                }
                                            })
                                        });
                                } else {

                                    return Bill
                                        .destroy({
                                            where: {
                                                id: req.params.id
                                            }
                                        })
                                        .then((rowDeleted) => {
                                            let eDate12 = new Date();
                                            let miliseconds12 = (eDate12.getTime() - sDate12.getTime());
                                            sdc.timing('get_bill_by_ID_api_time', miliseconds12);
                                            if (rowDeleted === 1) {
                                                LOGGER.info("BILL DELETED !!");
                                                res.status(204).send('Deleted successfully');
                                            }
                                        })
                                        .catch((e) => res.status(400).send({
                                            message: "Some Error Occured While Deleting!",
                                            error: e
                                        }))
                                }

                            })
                            .catch((error) => res.status(400).send({

                                message: "Bill not found!"
                            }));

                    } else {
                        LOGGER.error({ errors: errors.array() });
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })
            .catch((error) => res.status(400).send({
                message: "User not found"
            }));
    }

}
