const express = require('express')
const router = express.Router()
const { publishDomain, withdrawDomain } = require('../controllers/domain')

router.post('/publish-domain', publishDomain)
router.post('/withdraw-domain', withdrawDomain)

module.exports = router