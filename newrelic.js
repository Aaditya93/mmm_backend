'use strict'

exports.config = {
  app_name: ['mmm_backend'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: {
    enabled: true
  },
  logging: {
    level: 'info'
  }
}

