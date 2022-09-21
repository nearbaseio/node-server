const express = require('express')
const router = express.Router()
const { createWalletUSDC, Deposit, fundingTron, returnTron } = require('../controllers/wallet')

router.get('/create-wallet', createWalletUSDC)
router.get('/deposit', Deposit)
router.post('/funding-tron', fundingTron)
router.post('/return-tron', returnTron)

module.exports = router