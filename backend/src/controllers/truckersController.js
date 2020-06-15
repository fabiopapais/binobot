const connection = require('../database/connection')

const axios = require('axios')


module.exports = { 
    async create(req, res) {
        var { name, telephone } = req.body

        const id = await connection('truckers').insert({
            name: name,
            telephone: telephone,
        })

        res.status(200).json({ success: "Trucker created with sucess" })
    },
    async index(req, res) {
        
    }
}