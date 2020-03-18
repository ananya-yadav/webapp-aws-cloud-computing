const Bill = require("../models/bill").Bill;
const File = require("../models/fileModel").Files;
const User = require('../models/userModel').User;
const moment = require('moment');
const fs = require('fs');
const md5File = require('md5-file');

//LOGGER
const LOGGER = require("../logger/logger.js");
const SDC = require('statsd-client');
const sdc = new SDC({ host: 'localhost', port: 8125 });

moment.suppressDeprecationWarnings = true;

const uuidv4 = require('uuid/v4');
const path = require('path');


const multer = require('multer');
// const bucket = "to run locally uncomment this!";
const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
aws.config.update({
    region: 'us-east-1'
});

const multerS3 = require('multer-s3');
const bucket = process.env.S3_BUCKET;
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const uploadS3 = multer({
    fileFilter: function (req, file, callback) {
        let ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.pdf' && ext !== '.jpeg') {
            return callback({ "Error": "Only pdfs & images are allowed" }, false);
        }
        callback(null, true)
    },
    limits: {
        fileSize: 1024 * 1024
    },
    storage: multerS3({
        s3: s3,
        bucket: bucket,
        acl: 'private',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        //   serverSideEncryption: 'AES256',
        key: function (req, file, cb) {
            console.log("-----------------------------------------------------------------------------------");
            console.log("-----------------------------------------------------------------------------------");
            console.log("file.originalname" + file.originalname);
            console.log("-----------------------------------------------------------------------------------");
            console.log("-----------------------------------------------------------------------------------");
            cb(null, Date.now() + '-' + file.originalname)
        }
    })
}).single('billAttachment');

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        let ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.pdf' && ext !== '.jpeg') {
            return callback({ "Error": "Only pdfs & images are allowed" }, false);
        }
        callback(null, true)
    },
    limits: {
        fileSize: 1024 * 1024
    }
}).single('billAttachment');

// BCcypt
const bcrypt = require(`bcrypt`);
const Promise = require('promise');

const { validationResult } = require('express-validator');
module.exports = {

    createFile(req, res) {
        LOGGER.info("FILE IS BEING CREATED");
        sdc.increment('Create_file');
        let sDate = new Date();
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        if (!req.headers.authorization) {
            authenticationStatus(res);
            return;
        }
        authorizeAnUser(req, res).then(function (user) {
            return Bill
                .findAll({
                    where: {
                        id: req.params.id
                    },
                    limit: 1,
                    include: File
                })
                .then((bills) => {
                    if (bills.length == 0) {
                        return res.status(404).send({
                            message: "Bill Not Found!"
                        })
                    }
                    else if (bills[0].dataValues.owner_id != user.dataValues.id) {
                        return res.status(401).send({
                            message: "User not authorized to add attachment to this Bill!"
                        })
                    }
                    else if (bills[0].dataValues.attachment != null) {
                        return res.status(400).send({
                            message: "First delete the attachment to the bill before adding a new one!"
                        })
                    }
                    else {
                        let sd1 = new Date();
                        uploadS3(req, res, function (err) {
                            let ed1 = new Date();
                            let ms1 = (ed1.getTime() - sd1.getTime());
                            sdc.timing('create_file_upload_to_S3_Time', ms1);
                            if (err) {
                                return res.status(400).send(err);
                            } else {
                                let sd2 = new Date();
                                return File
                                    .create({
                                        id: uuidv4(),
                                        file_name: req.file.originalname,
                                        url: req.file.location,
                                        upload_date: new Date(),
                                        size: req.file.size,
                                        fileOwner: user.dataValues.email_address,
                                        bill: bills[0].dataValues.id,
                                        md5: "fieldName =>" + req.file.fieldname,
                                        key: req.file.key
                                    })
                                    .then((file) => {
                                        let ed2 = new Date();
                                        let ms2 = (ed2.getTime() - sd2.getTime());
                                        sdc.timing('create_file_DBQuery_Time', ms2);
                                        delete file.dataValues.createdAt;
                                        delete file.dataValues.updatedAt;
                                        delete file.dataValues.fileOwner;
                                        delete file.dataValues.size;
                                        delete file.dataValues.bill;
                                        delete file.dataValues.key;
                                        delete file.dataValues.md5;
                                        Bill
                                            .update(
                                                { attachment: file.dataValues.id },
                                                {
                                                    where: {
                                                        id: req.params.id
                                                    }
                                                }
                                            )
                                        let eDate = new Date();
                                        let miliseconds = (eDate.getTime() - sDate.getTime());
                                        sdc.timing('create_file_api_time', miliseconds);
                                        res.status(201).send(file);
                                    })
                                    .catch((error) => {
                                        res.status(400).send(error);
                                    });


                            }
                        });
                    }
                })
                .catch((error) => {
                    LOGGER.error({ errors: errors.array() });
                    if (error.parent.file == "uuid.c") {
                        res.status(400).send({
                            message: "Invalid Bill Id type: UUID/V4 Passed!"
                        })
                    }
                    res.status(400).send({

                        message: "Bill Not Found!"
                    })
                });
        })
            .catch((error) => {
                LOGGER.error({ errors: errors.array() });
                res.status(400).send({
                    error: error
                })
            });

    },

    getFile(req, res) {
        LOGGER.info("Access the file");
        sdc.increment('get_file');
        let sDate1 = new Date();
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        if (!req.headers.authorization) {
            authenticationStatus(res);
            return;
        }
        authorizeAnUser(req, res).then(function (user) {
            return Bill
                .findAll({
                    where: {
                        id: req.params.billId
                    },
                    limit: 1
                })
                .then((bills) => {
                    if (bills.length == 0) {
                        return res.status(404).send({
                            message: "Bill Not Found!"
                        })
                    }
                    else if (bills[0].dataValues.owner_id != user.dataValues.id) {
                        return res.status(401).send({
                            message: "User not authorized to add attachment to this Bill!"
                        })
                    }
                    else {
                        let sd3 = new Date();
                        return File
                            .findAll({
                                where: {
                                    id: req.params.fileId
                                }
                            })
                            .then((file) => {
                                let ed3 = new Date();
                                let ms3 = (ed3.getTime() - sd3.getTime());
                                sdc.timing('get_file_DBQuery_time', ms3);
                                LOGGER.info("GETTING THE FILE !!");
                                if (file.length == 0) {
                                    return res.status(404).send({
                                        message: "File Not Found!"
                                    })
                                }
                                if (file[0].bill != req.params.billId) {
                                    return res.status(404).send({
                                        message: "File for this Bill Not Found!"
                                    })
                                }
                                delete file[0].dataValues.createdAt;
                                delete file[0].dataValues.updatedAt;
                                delete file[0].dataValues.fileOwner;
                                delete file[0].dataValues.size;
                                delete file[0].dataValues.key;
                                delete file[0].dataValues.bill;
                                delete file[0].dataValues.md5;
                                let eDate1 = new Date();
                                let miliseconds1 = (eDate1.getTime() - sDate1.getTime());
                                sdc.timing('get_file_api_time', miliseconds1);
                                res.status(200).send(file[0]);
                            })
                            .catch((error) => {
                                if (error.parent.file == "uuid.c") {
                                    res.status(400).send({
                                        message: "Invalid File Id type: UUID/V4 Passed!"
                                    })
                                }
                                res.status(400).send(error);
                            });
                    }
                })
                .catch((error) => {
                    if (error.parent.file == "uuid.c") {
                        res.status(400).send({
                            message: "Invalid Bill Id type: UUID/V4 Passed!"
                        })
                    }
                    res.status(400).send({

                        message: "Bill Not Found!"
                    })
                    LOGGER.error({ errors: errors.array() });
                });
        })
            .catch((error) => {
                LOGGER.error({ errors: errors.array() });
                res.status(400).send({
                    error: error
                })
            });

    },

    deleteFile(req, res) {
        LOGGER.info("DELETING THE FILE");
        sdc.increment('delete_file');
        let sDate2 = new Date();
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        if (!req.headers.authorization) {
            authenticationStatus(res);
            return;
        }
        authorizeAnUser(req, res).then(function (user) {
            return Bill
                .findAll({
                    where: {
                        id: req.params.billId
                    },
                    limit: 1
                })
                .then((bills) => {
                    if (bills.length == 0) {
                        return res.status(404).send({
                            message: "Bill Not Found!"
                        })
                    }
                    else if (bills[0].dataValues.owner_id != user.dataValues.id) {
                        return res.status(401).send({
                            message: "User not authorized to add attachment to this Bill!"
                        })
                    }
                    else {
                        return Bill
                            .update({
                                attachment: null
                            }, {
                                where: {
                                    id: req.params.billId
                                }
                            })
                            .then((resp) => {
                                return File
                                    .findAll({
                                        where: {
                                            id: req.params.fileId
                                        }
                                    })
                                    .then((file) => {

                                        if (file.length == 0) {
                                            return res.status(404).send({
                                                message: "File Not Found!"
                                            })
                                        }
                                        if (file[0].bill != req.params.billId) {
                                            return res.status(404).send({
                                                message: "File for this Bill Not Found!"
                                            })
                                        }
                                        let sDate3 = new Date();
                                        s3.deleteObject({
                                            Bucket: bucket,
                                            Key: file[0].key
                                        }, function (err09) {
                                            let eDate3 = new Date();
                                            let miliseconds3 = (eDate3.getTime() - sDate3.getTime());
                                            sdc.timing('delete_file_S3Delete_time', miliseconds3);
                                            if (err09) {
                                                return res.status(400).send({
                                                    message: "Error while deleting from S3!"
                                                })
                                            } else {
                                                let sDate4 = new Date();
                                                return File
                                                    .destroy({
                                                        where: {
                                                            id: req.params.fileId
                                                        }
                                                    })
                                                    .then((rowDeleted) => {
                                                        let eDate4 = new Date();
                                                        let miliseconds4 = (eDate4.getTime() - sDate4.getTime());
                                                        sdc.timing('delete_file_DBQuery_time', miliseconds4);
                                                        if (rowDeleted === 1) {
                                                            LOGGER.info("FILE DELETED");
                                                            let eDate2 = new Date();
                                                            let miliseconds2 = (eDate2.getTime() - sDate2.getTime());
                                                            sdc.timing('delete_file_api_time', miliseconds2);
                                                            res.status(204).send('Deleted successfully');
                                                        }
                                                    })
                                                    .catch((error2) => {
                                                        LOGGER.error({ errors: errors.array() });
                                                        res.status(400).send(error2);
                                                    });
                                            }
                                        })
                                    })
                                    .catch((error) => {
                                        if (error.parent.file == "uuid.c") {
                                            res.status(400).send({
                                                message: "Invalid File Id type: UUID/V4 Passed!"
                                            })
                                            LOGGER.error({ errors: errors.array() });
                                        }
                                        res.status(400).send(error);
                                    });
                            })
                            .catch((error1) => {
                                LOGGER.error({ errors: errors.array() });
                                res.status(400).send(error1);
                            })
                    }
                })
                .catch((error) => {
                    if (error.parent.file == "uuid.c") {
                        res.status(400).send({
                            message: "Invalid Bill Id type: UUID/V4 Passed!"
                        })
                    }
                    res.status(400).send({
                        message: "Bill Not Found!"
                    })
                });
        })
            .catch((error) => {
                res.status(400).send({
                    error: error
                })
                LOGGER.error({ errors: errors.array() });
            });

    }


}

const realm = 'Basic Authentication';

function authenticationStatus(resp) {
    resp.writeHead(401, { 'WWW-Authenticate': 'Basic realm="' + realm + '"' });
    resp.end('Basic Authorization is needed! Please provide Username and Password!');
};

const authorizeAnUser = function (req, res) {
    return new Promise(function (resolve, reject) {
        let authentication = req.headers.authorization.replace(/^Basic/, '');
        authentication = (new Buffer(authentication, 'base64')).toString('utf8');
        const loginInfo = authentication.split(':');
        const userName = loginInfo[0];
        const passwordFromToken = loginInfo[1];

        User
            .findAll({
                limit: 1,
                where: {
                    email_address: userName
                },
            })
            .then((user) => {
                if (user.length == 0) {
                    reject(Error("Invalid Username!"));
                    return res.status(404).send({
                        message: 'User Not Found! Invalid Username!',
                    });
                }
                bcrypt.compare(passwordFromToken, user[0].dataValues.password, function (err, res2) {
                    if (err) {
                        reject(Error("Passwords Error!"));
                        return res.status(400).send({
                            message: 'Error occured while comparing passwords.'
                        })
                    }
                    if (res2) {
                        resolve(user[0]);
                    } else {
                        reject(Error(`Wrong Passwords!`));
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })
            .catch((error) => {
                reject(error);
                return res.status(400).send({
                    message: 'Error occured while finding an user!'
                });

            });
    });
}