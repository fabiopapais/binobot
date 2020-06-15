const connection = require('../database/connection')
const knexfile = require('../../knexfile')
const knex = require('knex')(knexfile)
const axios = require('axios')
var encodeUrl = require('encodeurl')
require('dotenv').config()

module.exports = {  
    async create(req, res) { 
        const { stars, price, point_name, telephone, avaliation } = req.body

        console.log(req.body)

        const trucker_id = await connection('truckers').where('telephone', telephone).select('id')
        const point_id = await connection('points').where('name', point_name).select('id')

        console.log(trucker_id[0].id, point_id[0].id)

        await connection('points_truckers').insert({
            avaliation: avaliation,
            trucker_id: trucker_id[0].id,
            point_id: point_id[0].id,
            stars: stars, 
            price: price
        })

        const point = await connection('points').where('id', point_id[0].id)

        const prices_count = point[0].prices_count || 0
        const stars_count = point[0].stars_count || 0

        await connection('points').where('id', point_id[0].id).update({
            stars_count: stars_count + 1,
            prices_count: prices_count + 1
        })

        const coinsObject = await connection('truckers').where('id', trucker_id[0].id).select('coins') || 0

        const coins = coinsObject[0].coins

        await connection('truckers').where('id', trucker_id[0].id).update({
            coins: coins + 50
        }) 

        res.status(200).json({ success: "Avaliation made with success!" })
    }, 
    async show(req, res) { 
        const { id } = req.params

        const avaliations = await connection('points_truckers').where('point_id', id).select('*')

        console.log(avaliations)

        res.status(200).json(avaliations)
    }
} 