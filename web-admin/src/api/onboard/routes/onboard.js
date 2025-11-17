'use strict';

module.exports = {
    routes: [
        {
            method: "POST",
            path: "/onboard/payment",
            handler: "onboard.createPaymentOrder"
        }, {
            method: "POST",
            path: "/onboard/payment/verify",
            handler: "onboard.verifyPayment"
        },
        {
            method: "GET",
            path: "/onboard/newPassword/:email",
            handler: "onboard.changePassword"
        },
        {
            method: "GET",
            path: "/onboard/email/verify/:email/:otp",
            handler: "onboard.verifyAC"
        },
        {
            method: "GET",
            path: "/onboard/email/token/:email",
            handler: "onboard.generateToken"
        },
        {
            method: "POST",
            path: "/onboard/fileupload",
            handler: "onboard.fileUpload"
        },
        {
            method: "PUT",
            path: "/onboard/update/password",
            handler : "onboard.updatePassword"
        }
    ]
}
