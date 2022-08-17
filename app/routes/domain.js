const express = require('express')
const router = express.Router()
const { cancelDomain, publishDomain, withdrawDomain } = require('../controllers/domain')

router.post('/publish-domain', publishDomain)
router.post('/withdraw-domain', withdrawDomain)
router.post('/cancel-domain', cancelDomain)

module.exports = router