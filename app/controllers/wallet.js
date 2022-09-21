const axios = require('axios')
const { dbConnect } = require('../../config/postgres')
const TronWeb = require('tronweb');
const HttpProvider = TronWeb.providers.HttpProvider;

CONTRACT = process.env.CONTRACT
TRON_PRO_API_KEY = process.env.TRON_PRO_API_KEY
OWNER_ACCOUNT = process.env.OWNER_ACCOUNT
OWNER_PRIVATEKEY = process.env.OWNER_PRIVATEKEY

const createWalletUSDC = async (req, res) => {
    try {
        const fullNode = new HttpProvider("https://api.trongrid.io");
        const solidityNode = new HttpProvider("https://api.trongrid.io");
        const eventServer = new HttpProvider("https://api.trongrid.io");
 
        const tronWeb = new TronWeb(fullNode,solidityNode,eventServer)
        tronWeb.setHeader({"TRON-PRO-API-KEY": TRON_PRO_API_KEY});

        const account = await tronWeb.createAccount();
        console.log(account)
        console.log(account)
        res.json(account)
    } catch (error) {
        console.error(error);
    }
}

const fundingTron = async (req, res) => {
    try {
        const fullNode = new HttpProvider("https://api.trongrid.io");
        const solidityNode = new HttpProvider("https://api.trongrid.io");
        const eventServer = new HttpProvider("https://api.trongrid.io");

        const tronWeb = new TronWeb(fullNode,solidityNode,eventServer)
        tronWeb.setHeader({"TRON-PRO-API-KEY": TRON_PRO_API_KEY});

        const conexion = await dbConnect()
        const resultado = await conexion.query("select * \
                                    from backend_perfil")

        if (resultado.rows.length !== 0) {
            for (var i = 0; i < resultado.rows.length; i++) {
                console.log(resultado.rows[i].wallet)
                tronWeb.setAddress(CONTRACT);
                const contract = await tronWeb.contract().at(CONTRACT);
      
                const balanceToken = await contract.balanceOf(resultado.rows[i].wallet).call();
                console.log(Number(balanceToken))

                if (balanceToken >= 1000000) {
                    console.log(resultado.rows[i].wallet)
                    const balanceTron = await tronWeb.trx.getBalance(resultado.rows[i].wallet)
                    console.log(Number(balanceTron))
                    if (balanceTron <= 10000000) {
                        console.log("funding")
                        fundingTronFn(resultado.rows[i].wallet, 15000000)
                    } else {
                        console.log("Cobro balance token")
                        transferToken(resultado.rows[i].wallet, String(balanceToken))
                    }
                }
            }
            res.json(true)
        }
    } catch (error) {
        console.error(error);
        res.json(false)
    }
}

async function transferToken(wallet, amount) { 
    try {
        const fullNode = new HttpProvider("https://api.trongrid.io");
        const solidityNode = new HttpProvider("https://api.trongrid.io");
        const eventServer = new HttpProvider("https://api.trongrid.io");

        const conexion = await dbConnect()
        const resultado = await conexion.query("select * \
                                    from backend_credentials where wallet=$1", [wallet])

        const credentials = resultado.rows[0]

        const privateKey = credentials.private_key
 
        const tronWeb = new TronWeb(fullNode,solidityNode,eventServer,privateKey)
        tronWeb.setHeader({"TRON-PRO-API-KEY": TRON_PRO_API_KEY});

        tronWeb.setAddress(wallet);
        const contract = await tronWeb.contract().at(CONTRACT);
      
        let result = await contract.transfer(OWNER_ACCOUNT, amount).send();
        console.log(result)
        return result
    } catch (error) {
        console.error(error);
        return false
    }
}

async function fundingTronFn(address, amount) { 
    try {
        const fullNode = new HttpProvider("https://api.trongrid.io");
        const solidityNode = new HttpProvider("https://api.trongrid.io");
        const eventServer = new HttpProvider("https://api.trongrid.io");
        //const privateKey = "DD849AD1AFFC23F7438B9829523DD2A70BB8EA21BF62E694E7A66C2150B5F8C2"

        const tronWeb = new TronWeb(fullNode,solidityNode,eventServer)
        tronWeb.setHeader({"TRON-PRO-API-KEY": TRON_PRO_API_KEY});

        tronWeb.setAddress(OWNER_ACCOUNT);

        //var toAddress = tronWeb.address.toHex(address); 

        privateKey = OWNER_PRIVATEKEY

        const tx = await tronWeb.transactionBuilder.sendTrx(address, amount)
            .then(function (response) {
                //console.log(response)   
                return response
            })
            .catch(function (error) {
                console.log(error)
                return false
            });

        if (tx) {
            const signedTxn = await tronWeb.trx.sign(tx, privateKey);

            if (!signedTxn.signature) {
                return console.error('Transaction was not signed properly');
            }
            const broadcast = await tronWeb.trx.sendRawTransaction(signedTxn);
            //const broadcast = "hola"
            console.log(`broadcast: ${broadcast}`);
            return broadcast
        } else {
            return false
        }
    } catch (error) {
        console.error(error);
        return false
    }
}

const returnTron = async (req, res) => {
    try {
        const fullNode = new HttpProvider("https://api.trongrid.io");
        const solidityNode = new HttpProvider("https://api.trongrid.io");
        const eventServer = new HttpProvider("https://api.trongrid.io");

        const tronWeb = new TronWeb(fullNode,solidityNode,eventServer)
        tronWeb.setHeader({"TRON-PRO-API-KEY": TRON_PRO_API_KEY});

        const conexion = await dbConnect()
        const resultado = await conexion.query("select * \
                                    from backend_perfil")

        if (resultado.rows.length !== 0) {
            for (var i = 0; i < resultado.rows.length; i++) {
                console.log(resultado.rows[i].wallet)
                tronWeb.setAddress(CONTRACT);
                const contract = await tronWeb.contract().at(CONTRACT);

                const infoTx = await tronWeb.trx.getBandwidth(resultado.rows[i].wallet)
                console.log("INFO",infoTx)
      
                const balanceToken = await contract.balanceOf(resultado.rows[i].wallet).call();
                console.log("USDT",Number(balanceToken))

                if (balanceToken < 10000) {
                    console.log(resultado.rows[i].wallet)
                    const balanceTron = await tronWeb.trx.getBalance(resultado.rows[i].wallet)
                    console.log("TRON",Number(balanceTron))
                    if (balanceTron > 1000) {
                        console.log("return tron")
                        returnTronFn(resultado.rows[i].wallet, balanceTron)
                    }
                }
            }
            res.json()
        }
    } catch (error) {
        console.log(error);
        console.log("MAIN ERROR")
        res.json(false)
    }
}

async function returnTronFn(wallet, amount) { 
    try {
        const fullNode = new HttpProvider("https://api.trongrid.io");
        const solidityNode = new HttpProvider("https://api.trongrid.io");
        const eventServer = new HttpProvider("https://api.trongrid.io");
        //const privateKey = "DD849AD1AFFC23F7438B9829523DD2A70BB8EA21BF62E694E7A66C2150B5F8C2"

        const tronWeb = new TronWeb(fullNode,solidityNode,eventServer)
        tronWeb.setHeader({"TRON-PRO-API-KEY": TRON_PRO_API_KEY});

        const conexion = await dbConnect()
        const resultado = await conexion.query("select * \
                                    from backend_credentials where wallet=$1", [wallet])

        const credentials = resultado.rows[0]

        const privateKey = credentials.private_key

        console.log(credentials)
        console.log(wallet)

        tronWeb.setAddress(wallet);

        const infoTx = await tronWeb.trx.getBandwidth(wallet)

        let amountFinal
        
        if (infoTx >= 268) {
            amountFinal = amount
        } else {
            amountFinal = amount - 268000
        }

        console.log(amountFinal)

        const tx = await tronWeb.transactionBuilder.sendTrx(OWNER_ACCOUNT, amountFinal)
            .then(function (response) {
                //console.log(response)   
                return response
            })
            .catch(function (error) {
                console.log(error)
                return false
            });

        console.log("TX", tx)


        if (tx) {
            const signedTxn = await tronWeb.trx.sign(tx, privateKey);

            if (!signedTxn.signature) {
                return console.error('Transaction was not signed properly');
            }
            //const broadcast = await tronWeb.trx.sendRawTransaction(signedTxn);
            const broadcast = "hola"
            console.log(broadcast)
            return broadcast
        } else {
            return false
        }
    } catch (error) {
        //console.error(error);
        return false
    }
}

const Deposit = async (req, res) => {
    try {
        const conexion = await dbConnect()
        const resultado = await conexion.query("select * \
                                    from backend_perfil")

        if (resultado.rows.length !== 0) {
            for (var i = 0; i < resultado.rows.length; i++) {
                console.log(resultado.rows[i].user_id)
                DepositFn(resultado.rows[i].wallet)
            }
            res.json("Bien")
        }
    } catch (error) {
        console.error(error);
        res.json(false)
    }
}

//const Deposit = async (req, res) => {
async function DepositFn(address) { 
    try {
        //const { address } = req.body
        const fullNode = new HttpProvider("https://api.trongrid.io");
        const solidityNode = new HttpProvider("https://api.trongrid.io");
        const eventServer = new HttpProvider("https://api.trongrid.io");
 
        const tronWeb = new TronWeb(fullNode,solidityNode,eventServer)
        tronWeb.setHeader({"TRON-PRO-API-KEY": TRON_PRO_API_KEY});
        
        const url = "https://api.trongrid.io/v1/accounts/" + address + "/transactions/trc20?limit=100&contract_address=" + CONTRACT

        const result = await axios.get(url)
                    .then(function (response) {   
                        return response.data.data
                    })
                    .catch(function (error) {
                        console.log("error")
                        return false
                    });


        if (result) {
            for (var i = 0; i < result.length; i++) {
                if (result[i].to === address) {
                    const conexion = await dbConnect()
                    const resultado = await conexion.query("select * \
                                                from deposits where \
                                                transaction_id = $1 and to_address = $2\
                                                ", [result[i].transaction_id, result[i].to])
                    
                    if (resultado.rows.length === 0) {

                        let amountUSD = result[i].value / 1000000
                        
                        const result2 = await conexion.query(`insert into deposits
                                (transaction_id, value, from_address, to_address, block_timestamp, value_usd, coin)
                                values ($1, $2, $3, $4, $5, $6, $7)`, [result[i].transaction_id, amountUSD, result[i].from, result[i].to, result[i].block_timestamp, amountUSD, result[i].token_info.symbol])
                                    .then(() => {
                                        return true
                                    }).catch((error) => {
                                        return error
                                    })

                        if (result2 === true) {
                            const result3 = await conexion.query("select * \
                                                from backend_perfil where \
                                                wallet = $1\
                                                ", [address])
            
                            if (result3.rows[0]) {
                                const user = result3.rows[0]

                                const balance = parseFloat(user.balance) + parseFloat(amountUSD)
            
                                const result4 = await conexion.query("update backend_perfil\
                                    set balance = $1 where\
                                    wallet = $2\
                                    ", [balance, address])
                                        .then((response) => {
                                            //console.log(response)
                                            console.log("HOLA")
                                            return true
                                        }).catch((error) => {
                                            return  false
                                        })
                                if (result4 === false) {
                                    await conexion.query("delete \
                                        from deposits where \
                                        transaction_id = $1\
                                        ", [result[i].transaction_id])
                                }
                            }
                        }
                    } else {
                        console.log("SALE")
                        break
                    }
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = { createWalletUSDC, Deposit, fundingTron, returnTron }