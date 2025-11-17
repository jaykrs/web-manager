'use strict';

/**
 * publicasset service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::publicasset.publicasset');
