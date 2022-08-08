const { dbConnect } = require('../../config/postgres')

async function setEmailSuscribe(req, res) {
    try {
        const { email } = req.body
        console.log(email)
        var result

        rul_format = /.+@.+\..+/.test(email) || false;

        if (rul_format) {
            const conexion = await dbConnect()
            await conexion.query(`insert into suscribe
                    (email)
                    values ($1)`, [email])
                .then(() => {
                    result = true
                }).catch((error) => {
                    result = false
                    console.log(error)
                })
            if (result === true) {
                res.json({respuesta: "ok", data: result})
            } else {
                res.status(404).json()
            }
        } else {
            res.status(204).json({respuesta: "email invalido"})
        }
    } catch (error) {
        res.status(500).json({respuesta: "Error interno del sistema"})
    }
}

module.exports = { setEmailSuscribe }