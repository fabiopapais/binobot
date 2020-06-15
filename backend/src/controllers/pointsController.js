require('dotenv').config()

const connection = require('../database/connection')
const axios = require('axios')

var encodeUrl = require('encodeurl')



module.exports = {
    async create(req, res) {
        var { name, location } = req.body

        console.log(name, location)

        const url = encodeUrl(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${process.env.API_KEY}`)
        const mapsResponse = await axios.get(url)

        location = mapsResponse.data.results[0].formatted_address
        const latitude = mapsResponse.data.results[0].geometry.location.lat
        const longitude = mapsResponse.data.results[0].geometry.location.lng

        console.log(location, latitude, longitude)

        const id = await connection('points').insert({
            name: name,
            location: location,
            latitude: latitude,
            longitude: longitude
        })

        res.status(200).json({ success: "Point created with success" })
    },
    async show(req, res) {
        const { id } = req.params

        console.log(id)

        const point = await connection('points').where('id', id).select('*')

        let totalPrices = await connection('points_truckers').where('point_id', point[0].id).select('price')
        let pricesCount = await connection('points').where('id', point[0].id).select('prices_count')

        let totalPrice = 0
        totalPrices.map(prices => {
            totalPrice += prices.price
        })

        let totalStars = await connection('points_truckers').where('point_id', point[0].id).select('stars')
        let starsCount = await connection('points').where('id', point[0].id).select('stars_count')
        
        let totalStar = 0
        totalStars.map(star => {
            totalStar += star.stars
        })

        const medium_price = totalPrice / pricesCount[0].prices_count
        const medium_star = totalStar / starsCount[0].stars_count

        const data = {
            name: point[0].name,
            starts: medium_star.toFixed(1),
            price: medium_price.toFixed(1)
        }

        console.log(data)

        return res.status(200).json(data)
    }
}