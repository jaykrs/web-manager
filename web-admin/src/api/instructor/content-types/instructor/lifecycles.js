"use strict";

module.exports = {
   async afterCreate(event) {
     const axios = require("axios");
     const emailConfig = require("../../../../../config/payment");
        const { result, params } = event;
        const entries = await strapi.entityService.findMany('api::template.template', {
            filters: {
                name: `signup_success_email`,
            },
        });
        let templates = "";

        await entries.forEach(el => {
            templates = el.template;
        });
        templates =  templates.replace("@UserName",result.display_name);

        const emailKey = await strapi.entityService.findMany('api::config.config', {
            filters: {
                key: `emailKey`,
            },
        });
        let newEmailKey = emailKey[0].value;
        
        await axios.post(emailConfig.brevoUrl, {
            //  "data":{  
            "sender": {
                "name": "Noreply Support",
                "email": "noreply@edoctry.com"
            },
            "to": [
                {
                    "email": result.instructoremail,
                    "name": result.display_name
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
    },
    afterUpdate(event) {
       // console.log('afterUpdate');
    }
}