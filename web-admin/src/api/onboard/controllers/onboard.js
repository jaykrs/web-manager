"use strict";
const RazorPay = require("razorpay");
const emailConfig = require("../../../../config/payment");
const crypto = require("crypto");
const mysql = require("mysql");
const nodemailer = require("nodemailer");
// let emailConfig = require("../../../../config/emailService");
let axios = require("axios");
const bcrypt = require("bcrypt");
var generator = require('generate-password');
const ImageKit = require("imagekit");
const fs = require('fs');
const databaseConfig = require("../../../../config/database");

module.exports =  {
    async createPaymentOrder(ctx, next) {
        const { amount, currency } = ctx.request.body;
        let instance = new RazorPay({
            key_id: strapi.config.server.P_KEY_ID,
            key_secret: strapi.config.server.P_SECRECT
        })
        await instance.orders.create({
            amount: amount * 100,
            currency: currency,
            receipt: crypto.randomBytes(10).toString("hex"),
        }).then(res => {
            console.log(res)
            ctx.body = {
                statusCode: 200,
                success: true,
                data: res
            }
        }).catch(err => {
            console.log(err);
            ctx.body = {
                statusCode: 500,
                message: "internal Server Error"
            }
        })


    },
    async verifyPayment(ctx, next) {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = ctx.request.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto.createHmac("sha256", strapi.config.server.P_SECRECT).update(sign.toString()).digest("hex")

        if (razorpay_signature === expectedSign) {
            ctx.body = {
                statusCode: 200,
                message: "Payment verified successfully"
            }
        } else {
            ctx.body = {
                statusCode: 400,
                message: "Invalid signature sent!"
            }
        }
    },
    async changePassword(ctx, next) {
        let connection = mysql.createConnection({
            host: strapi.config.server.hostD,
            user: strapi.config.server.user,
            password: strapi.config.server.password,
            database: strapi.config.server.database,
            port: strapi.config.server.portD
        })
        const emailKey = await strapi.entityService.findMany('api::config.config', {
            filters: {
                key: `emailKey`,
            },
        });
        let newEmailKey = emailKey[0].value;
        var name = null;
        var _email = null;
        var resultArray = null;
        var dynamicInput = "'" + ctx.request.params.email + "'";
        const password = generator.generate({
            length: 10,
            numbers: true
        });
        const hashPassword = await bcrypt.hash(password, 10);
        const entries = await strapi.entityService.findMany('api::template.template', {
            filters: {
                name: `changedPassword`,
            },
        });
        let templates = "";

        await entries.forEach(el => {
            templates = el.template;
        })

        templates = templates.replace("@User_Name", "Dear");
        templates = templates.replace("@User_password", password);
        await axios.post(strapi.config.server.brevoUrl, {
            //  "data":{  
            "sender": {
                "name": "Noreply Support",
                "email": "noreply@edoctry.com"
            },
            "to": [
                {
                    "email": ctx.request.params.email,
                    "name": "Hi dear"
                }
            ],
            "subject": "Welcome to Edoctry Learning App",
            "htmlContent": templates
            //   }

        }, {
            "headers": {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "api-key": newEmailKey
                //"api-key": emailConfig.api_key
            }
        }).then(res => {
            console.log("result", res.data, res.status);
        }).catch(err => {
            console.log("err", err);
        })
        connection.connect(function (err, next) {
            if (err) {
                console.log("connection error")
            }

            connection.query('SELECT * FROM `up_users` WHERE email = ' + dynamicInput + ' limit 1', async (err, rows, fields) => {
                if (!err) {
                    resultArray = Object.values(JSON.parse(JSON.stringify(rows)));
                    //  console.log(resultArray);
                    name = resultArray[0].username;
                    _email = resultArray[0].email;
                    var on = 1;
                    if (null != dynamicInput && null != _email && null != resultArray) {
                        console.log('update started');
                        var sql = "UPDATE `up_users` SET password = '" + hashPassword + "' WHERE email = " + dynamicInput;
                        connection.query(sql, function (err, result) {
                            if (err) { console.log(err) };
                            console.log(result.affectedRows + " record(s) updated");
                        })
                        connection.end();
                    }
                }

            });

            console.log("Connection established with database");
        })
        ctx.body = {
            success: true,
            message: "Email sent"
        }

    },
    async verifyAC(ctx, next) {
        let connection = mysql.createConnection({
            host: strapi.config.server.hostD,
            user: strapi.config.server.user,
            password: strapi.config.server.password,
            database: strapi.config.server.database,
            port: strapi.config.server.portD,
            multipleStatements: true
        })

        let off = 0;
        var name = null;
        var _email = null;
        var resultArray = null;
        var dynamicInput = "'" + ctx.request.params.email + "'";
        const emailotp = ctx.request.params.otp;
        let message = "";
        let verifyEmail = async function () {
            connection.connect((err) => {
                if (!err)
                    connection.query('SELECT * FROM `up_users` WHERE email = ' + dynamicInput + ' limit 1', (err, rows, fields) => {
                        if (!err) {
                            resultArray = Object.values(JSON.parse(JSON.stringify(rows)));
                            name = resultArray[0].username;
                            _email = resultArray[0].email;
                            if (null != resultArray && (emailotp == resultArray[0].otp || emailotp == resultArray[0].phone_otp)) {
                                console.log('update started');
                                var sql = "UPDATE `up_users` SET blocked = " + off + " WHERE email = " + dynamicInput;
                                connection.query(sql, function (err, result) {
                                    if (err) { console.log(err) };
                                    console.log(result.affectedRows + " record(s) updated");
                                })

                                connection.end();
                                message = "verified"
                                // return "Verified";
                            } else {
                                console.log("faild")
                                message = "verification faild"
                                ctx.response.body = "Faild"
                            }
                        }
                    });
                else
                    console.log('Connection Failed!' + JSON.stringify(err, undefined, 2));
            });
        }
        await verifyEmail();
        ctx.body = "Your account verified successfully";
    },

    async generateToken(ctx, next) {

        let connection = mysql.createConnection({
            host: strapi.config.server.hostD,
            user: strapi.config.server.user,
            password: strapi.config.server.password,
            database: strapi.config.server.database,
            port: strapi.config.server.portD
        })
        const emailKey = await strapi.entityService.findMany('api::config.config', {
            filters: {
                key: `emailKey`,
            },
        });
        let newEmailKey = emailKey[0].value;
        var name = null;
        var _email = null;
        var resultArray = null;
        var dynamicInput = "'" + ctx.request.params.email + "'";
        const emailotp = (Math.random() + 1).toString(10).substring(12);
        const phoneotp = (Math.random() + 1).toString(10).substring(12);
        let link = strapi.config.server.url + "onboard/email/verify/" + ctx.request.params.email + "/" + emailotp;

        const entries = await strapi.entityService.findMany('api::template.template', {
            filters: {
                name: `userVerify`,
            },
        });
        let templates = "";

        await entries.forEach(el => {
            templates = el.template;
        })

        // templates = templates.replace("@User_Name", "Dear");
        templates = templates.replace("@User_verify", link);
        await axios.post(strapi.config.server.brevoUrl, {
            //  "data":{  
            "sender": {
                "name": "Noreply Support",
                "email": "noreply@edoctry.com"
            },
            "to": [
                {
                    "email": ctx.request.params.email,
                    "name": "Hi dear"
                }
            ],
            "subject": "Welcome to Edoctry Learning App",
            "htmlContent": templates
            //   }

        }, {
            "headers": {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "api-key": newEmailKey
               // "api-key": emailConfig.api_key
            }
        }).then(res => {
            console.log("result", res.data, res.status);
        }).catch(err => {
            console.log("err", err);
        })

        async function getConnection() {
            connection.connect(function (err, next) {
                if (err) {
                    console.log("connection error")
                }

                connection.query('SELECT * FROM `up_users` WHERE email = ' + dynamicInput + ' limit 1', async (err, rows, fields) => {
                    if (!err) {
                        resultArray = Object.values(JSON.parse(JSON.stringify(rows)));
                        //  console.log(resultArray);
                        name = resultArray[0].username;
                        _email = resultArray[0].email;
                        var on = 1;
                        if (null != dynamicInput && null != _email && null != resultArray) {
                            console.log('update started');
                            var sql = "UPDATE `up_users` SET blocked = " + on + ", otp = " + emailotp + ", phone_otp = " + phoneotp + " WHERE email = " + dynamicInput;
                            connection.query(sql, function (err, result) {
                                if (err) { console.log(err) };
                                console.log(result.affectedRows + " record(s) updated");
                            })
                            connection.end();
                        }

                    }
                })

                console.log("connection established successfully");
            });
        }
        await getConnection();
        ctx.body = {
            success: true,
            message: "Email sent"
        }
    },
    async fileUpload(ctx, next) {
        console.log(ctx.request.files);
        var ImageKit = require("imagekit");
        if (!ctx.request.files) {
            ctx.response.send({
                status: false,
                message: 'No files found'
            });
        }
        var imagekit = new ImageKit({
            publicKey: strapi.config.server.publicKey,
            privateKey: strapi.config.server.privateKey,
            urlEndpoint: strapi.config.server.urlEndpoint
        });

        const file = fs.createReadStream(ctx.request.files.file.path);
        await imagekit.upload({
            file: file, //required
            fileName: ctx.request.files.file.name,   //required
            extensions: [
                {
                    name: "google-auto-tagging",
                    maxTags: 5,
                    minConfidence: 95
                }
            ]
        }).then(response => {
            console.log(response);
            ctx.body = response;
        }).catch(error => {
            console.log(error);
            ctx.body = error;
        });

    },
    async updatePassword(ctx, next) {
        let connection = mysql.createConnection({
            host: strapi.config.server.hostD,
            user: strapi.config.server.user,
            password: strapi.config.server.password,
            database: strapi.config.server.database,
            port: strapi.config.server.portD
        })
        const emailKey = await strapi.entityService.findMany('api::config.config', {
            filters: {
                key: `emailKey`,
            },
        });
        let newEmailKey = emailKey[0].value;
        var name = null;
        var _email = null;
        let resultArray = null;
        let dynamicInput = "'" + ctx.request.body.email + "'";
        let password = ctx.request.body.newPassword;
        let oldPassword = ctx.request.body.oldPassword;
        const hashPassword = await bcrypt.hash(password, 10);
        const entries = await strapi.entityService.findMany('api::template.template', {
            filters: {
                name: `password_Updated`,
            },
        });
        let templates = "";

        await entries.forEach(el => {
            templates = el.template;
        });

        connection.connect(function (err, next) {
            if (err) {
                console.log("connection error");
            }

            connection.query('SELECT * FROM `up_users` WHERE email = ' + dynamicInput + ' limit 1', async (err, rows, fields) => {
                if (!err) {
                    resultArray = Object.values(JSON.parse(JSON.stringify(rows)));
                    //  console.log(resultArray);
                    name = resultArray[0].username;
                    _email = resultArray[0].email;
                    var on = 1;
                    let isValidPassword = bcrypt.compare(oldPassword, resultArray[0].password);
                    if (null != dynamicInput && null != _email && null != resultArray && isValidPassword) {
                        console.log('update started');
                        var sql = "UPDATE `up_users` SET password = '" + hashPassword + "' WHERE email = " + dynamicInput;
                        connection.query(sql, function (err, result) {
                            if (err) { console.log(err) };
                            console.log(result.affectedRows + " record(s) updated");
                        })
                        connection.end();
                        
                        await axios.post(strapi.config.server.brevoUrl, {
                            //  "data":{  
                            "sender": {
                                "name": "Noreply Support",
                                "email": "noreply@edoctry.com"
                            },
                            "to": [
                                {
                                    "email": ctx.request.params.email,
                                    "name": name
                                }
                            ],
                            "subject": "Welcome to Edoctry Learning App",
                            "htmlContent": templates
    
                        }, {
                            "headers": {
                                "Content-Type": "application/json",
                                "Accept": "application/json",
                                "api-key": newEmailKey
                                //"api-key": emailConfig.api_key
                            }
                        }).then(res => {
                            console.log("result", res.data, res.status);
                        }).catch(err => {
                            console.log("err", err);
                        })
                    } 

                    
                }

            });

            console.log("Connection established with database");
        })

        ctx.body = {
            sucess:true,
            message:"updated"
        }

    }

}
