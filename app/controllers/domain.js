const axios = require('axios')
const { CONFIG } = require('../helpers/utils')
const nearAPI = require("near-api-js");
const nearSEED = require("near-seed-phrase");
const { keyStores, KeyPair , Near, Account, Contract, utils} = nearAPI;

const CONTRACT_NAME = process.env.CONTRACT_NAME;
const SIGNER_ID = process.env.SIGNER_ID;
const SIGNER_PRIVATEKEY = process.env.SIGNER_PRIVATEKEY;
const NETWORK = process.env.NETWORK;
const TOKEN_DJANGO = process.env.TOKEN_DJANGO

const publishDomain = async (req, res) => {
    try {
        const { domain, mnemonic , userSeller , price, coin} = req.body

        const response = await validateNearId(domain)

        if (response) {
            const result = await validateMnemonic(domain, mnemonic)
            if (result) {
                const seed = nearSEED.parseSeedPhrase(mnemonic)

                const keyStore = new keyStores.InMemoryKeyStore()
                const near = new Near(CONFIG(keyStore))

                const keyPair = KeyPair.fromString(seed.secretKey)
                keyStore.setKey("testnet", domain, keyPair)

                const account = new Account(near.connection,domain)

                const newItem = await nearSEED.generateSeedPhrase()

                newItem.domain = domain
                newItem.profile = userSeller
                newItem.price = price
                newItem.active = true

                await account.addKey(newItem.publicKey)
                const keys = await account.getAccessKeys()

                for (var i = 0; i < keys.length; i++) {
                    if (keys[i].public_key !== newItem.publicKey && keys[i].public_key !== seed.publicKey) {
                        await account.deleteKey(keys[i].public_key)
                    }
                }

                await account.deleteKey(seed.publicKey)


                const keyPairNB = KeyPair.fromString(SIGNER_PRIVATEKEY)
                keyStore.setKey(NETWORK, SIGNER_ID, keyPairNB)

                const nearNB = new Near(CONFIG(keyStore))

                const accountNB = new Account(nearNB.connection, SIGNER_ID)

                const contract = new Contract(accountNB, CONTRACT_NAME, {
                    changeMethods: ['publish_domain'],
                    sender: account
                })

                let date_ob = new Date();
                let date = ("0" + date_ob.getDate()).slice(-2);
                let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
                let year = date_ob.getFullYear();

                let dateFech = (year + "-" + month + "-" + date)

                contract.publish_domain(
                        {
                            domain: newItem.domain,
                            user_seller: newItem.profile,
                            price: utils.format.parseNearAmount(newItem.price),
                            date_fech: String(dateFech),
                            date_year: String(year),
                            date_month: String(month),
                            date_day: String(date)
                        },
                    ).then( async (response) => {
                        console.log(response)
                        newItem.id_contract = response.id
                        try {
                            method = 'post'
                            url = 'http://127.0.0.1:8000/api/v1/domain-credentials/'
                            await axios[method](url, newItem,
                                {
                                    headers:
                                    {
                                        'Content-Type': 'application/json',
                                        'Authorization': 'token ' + TOKEN_DJANGO,
                                    },
                                }).then((response) => {
                                    console.log("response")
                                    res.status(200).json()
                                }).catch((error) => {
                                    console.log("error")
                                    console.log("ERROR")
                                    res.status(404).json()
                                })
                        } catch (error) {
                            res.status(404).json()
                        }
                    }).catch((error) => {
                        res.status(404).json({"error": error})
                })
            } else {
                res.status(204).json()
            }
        } else {
            res.status(204).json()
        }
    } catch (error) {
        console.error(error);
        res.status(404).json()
    }
}

const withdrawDomain = async (req, res) => {
    try {
        const { owner_id, privateKey , id_domain} = req.body

        const resp = await validatePrivateKey(owner_id, privateKey)
      
        if (resp === true) {
            const keyStore = new keyStores.InMemoryKeyStore()

            const keyPair = KeyPair.fromString(privateKey)
            keyStore.setKey(NETWORK, owner_id, keyPair)

            const near = new Near(CONFIG(keyStore))

            const account = new Account(near.connection, owner_id)

            const contract = new Contract(account, CONTRACT_NAME, {
                viewMethods: ['get_domain_id'],
                changeMethods: ['retired_domain'],
                sender: account,
            })

            const response = await contract.get_domain_id(
                {
                    id: id_domain,
                })
            
            if (response[0]) {
                let domain = response[0]
                if (domain.owner_id === owner_id && domain.retired === false) {
                    
                    contract.retired_domain(
                        {
                            id: id_domain,
                        })
                        .then(async (response) => {
                            try {
                                method = 'post'
                                url = 'http://127.0.0.1:8000/api/v1/withdraw-domain'
                                let item = {
                                    id_contract: id_domain
                                }
                                await axios[method](url, item,
                                    {
                                        headers:
                                        {
                                            'Content-Type': 'application/json',
                                            'Authorization': 'token ' + TOKEN_DJANGO,
                                        },
                                    }).then((response) => {
                                        console.log(response.data)
                                        res.json(response.data)
                                    }).catch((error) => {
                                        console.log("ERROR")
                                        res.status(404).json()
                                    })
                            } catch (error) {
                                res.status(404).json()
                            }
                        }).catch((error) => {
                            console.log("ERROR")
                            res.status(404).json()
                        })
                } else {
                    res.status(401).json()
                }
            } else {
                res.status(204).json()
            }
        } else {
            res.status(401).json()
        }
    } catch (error) {
        res.status(404).json()
    }
}

async function validateNearId(nearId) { 
    try {
        const keyStore = new keyStores.InMemoryKeyStore()
        const near = new Near(CONFIG(keyStore))

        const account = new Account(near.connection, nearId)
        const response = await account.state()
            .then(() => {
                return true
            }).catch(() => {
                return false
            })
        return response
    } catch (error) {
        return false
    }
}

async function validateMnemonic(nearId, mnemonic) { 
    try {
        const seed = nearSEED.parseSeedPhrase(mnemonic)
        const keyStore = new keyStores.InMemoryKeyStore()
        const near = new Near(CONFIG(keyStore))
        const account = new Account(near.connection,nearId)
        const keys = await account.getAccessKeys()
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].public_key === seed.publicKey) {
                const permission = keys[i].access_key.permission
                if (permission === "FullAccess") {
                    return true
                }
                else {
                    return false
                }
            }
        } 
        return false
    } catch (error) {
        return false
    }
}

async function validatePrivateKey(nearId, privateKey) { 
    try {
        const keyPair = KeyPair.fromString(privateKey)
        const keyStore = new keyStores.InMemoryKeyStore()
        const near = new Near(CONFIG(keyStore))
        const account = new Account(near.connection,nearId)
        const keys = await account.getAccessKeys()

        for (var i = 0; i < keys.length; i++) {
            //console.log(keys[i].access_key.permission.FunctionCall.receiver_id)
            if (keys[i].public_key === keyPair.getPublicKey().toString()) {
                if (keys[i].access_key.permission) {
                    return true
                }
            }
        } 
        return false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = { publishDomain, withdrawDomain }