const express = require('express')
const connection = require('./database/connection')
const axios = require('axios')

require('dotenv').config()

const geolib = require('geolib')
var encodeUrl = require('encodeurl')
const knexfile = require('../knexfile')
const knex = require('knex')(knexfile)

const pointsController = require('./controllers/pointsController')
const truckersController = require('./controllers/truckersController')
const avaliationsController = require('./controllers/avaliationsController')

const routes = express.Router()

routes.post('/points', pointsController.create) // Criar ponto
routes.get('/points/:id', pointsController.show)

routes.post('/avaliations', avaliationsController.create) // Criar avaliação
routes.get('/avaliations/:id', avaliationsController.show) // Listar pontos de parada baseado nos lugares de partida e chegada

routes.post('/truckers', truckersController.create) // Criar caminhoneiro


function genericFulfillmentMessageFormatter(message) {
    return {
        "fulfillmentMessages": [
            {
                "text": {
                    "text": [
                        message
                    ]
                }
            }
        ]
    }
}

// Chatbot Twilio + Dialog Flow integration
routes.post('/', async (req, res) => {
    const intentName = req.body.queryResult.intent.displayName
    const params = req.body.queryResult.parameters
    console.log(req.body)

    if (intentName == "setNameIntent") {
        console.log("Cadastro caminhoneiro")
        const session = req.body.session
        const telephone = session.split(':').pop()

        const name = params.name.name

        await connection('truckers').insert({
            name: name,
            telephone: telephone,
        })

        return res.json(genericFulfillmentMessageFormatter(`Certo, vou te chamar de ${name}`))
    }
    else if (intentName == "tripEndLocaleIntent") {
        console.log("Listar pontos")

        try {
            const startLocation = req.body.queryResult.parameters.initialPoint

            const endLocation = req.body.queryResult.parameters.endPoint

            console.log(startLocation, endLocation)

            const url = encodeUrl(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLocation}&destination=${endLocation}&key=${process.env.API_KEY}`)
            const mapsResponse = await axios.get(url)

            console.log(mapsResponse.data, mapsResponse.data.routes)

            const startCoords = mapsResponse.data.routes[0].legs[0].start_location
            const endCoords = mapsResponse.data.routes[0].legs[0].end_location

            console.log(startCoords, endCoords)

            // Mapping logic
            const absoluteCenter = geolib.getCenter([
                { latitude: startCoords.lat, longitude: startCoords.lng },
                { latitude: endCoords.lat, longitude: endCoords.lng }
            ])
            const startCenter = geolib.getCenter([
                { latitude: startCoords.lat, longitude: startCoords.lng },
                { latitude: absoluteCenter.latitude, longitude: absoluteCenter.longitude }
            ])
            const endCenter = geolib.getCenter([
                { latitude: endCoords.lat, longitude: endCoords.lng },
                { latitude: absoluteCenter.latitude, longitude: absoluteCenter.longitude }
            ])

            const points = await connection('points').select('*')

            console.log(points)


            let validPoints = await points.filter(async point => {
                if (geolib.isPointWithinRadius(
                    { latitude: point.latitude, longitude: point.longitude },
                    { latitude: startCenter.latitude, longitude: startCenter.longitude },
                    5000
                ) || geolib.isPointWithinRadius(
                    { latitude: point.latitude, longitude: point.longitude },
                    { latitude: endCenter.latitude, longitude: endCenter.longitude },
                    5000
                )) {

                    return point
                }
            })

            for (let i = 0; i < validPoints.length; i++) {
                point = validPoints[i]
                let totalPrices = await connection('points_truckers').where('point_id', point.id).select('price')
                let pricesCount = await connection('points').where('id', point.id).select('prices_count')

                let totalPrice = 0
                totalPrices.map(prices => {
                    totalPrice += prices.price
                })

                point.medium_price = totalPrice / pricesCount[0].prices_count

                let totalStars = await connection('points_truckers').where('point_id', point.id).select('stars')
                let starsCount = await connection('points').where('id', point.id).select('stars_count')
                let totalStar = 0
                totalStars.map(star => {
                    totalStar += star.stars
                })

                point.medium_star = totalStar / starsCount[0].stars_count
                let avaliations = await connection('points_truckers').where('point_id', point.id).select('avaliation')
                point.avaliations = avaliations
                console.log(avaliations)
            }

            console.log("AQUI2", validPoints)

            if (validPoints.length == 0) {
                return res.json(
                    {
                        "fulfillmentMessages": [
                            {
                                "text": {
                                    "text": [
                                        "Desculpe, infelizmente não encontramos um ponto de parada nesta rota"
                                    ]
                                }
                            }
                        ]
                    }
                )
            }

            const response = validPoints.map(point => {
                let avaliation = point.avaliations[0].avaliation
                return {
                    "text": {
                        "text": [
                            `ID: *${point.id}*\n Nome: *${point.name}*\n Localização: *${point.location}*\n Avaliação: *${(point.medium_star).toFixed(1)}* ⭐\n Preços: *${(point.medium_price).toFixed(1)}* 💸\n Última avaliação: *"${avaliation}"*`
                        ]
                    }
                }
            })

            response.push({
                "text": {
                    "text": [
                        "Escolha os pontos de parada que você quer reservar. (Exemplo: 1, 3, 5, 6, 8)"
                    ]
                }
            })

            return res.json(
                {
                    "fulfillmentMessages":
                        response
                }
            )
        } catch (err) {
            console.log(err)
            return res.json(genericFulfillmentMessageFormatter("Desculpe, tivemos alguns problemas nos nossos sistemas... Por favor tente mais tarde " + err))
        }
    }
    else if (intentName == "setEvaluationCommentIntent") {
        const session = req.body.session
        const telephone = session.split(':').pop()
        const avaliation = req.body.queryResult.queryText
        const point_name = params.local
        const stars = params.stars
        const price = params.price

        console.log(avaliation)

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

        console.log("AQUI", point)

        await connection('points').where('id', point_id[0].id).update({
            stars_count: stars_count + 1,
            prices_count: prices_count + 1
        })

        const coinsObject = await connection('truckers').where('id', trucker_id[0].id).select('coins') || 0

        const coins = coinsObject[0].coins

        await connection('truckers').where('id', trucker_id[0].id).update({
            coins: coins + 50
        })

        return res.json({
            "fulfillmentMessages": [
                {
                    "text": {
                        "text": [
                            "Pronto! Obrigado pela avaliação!"
                        ]
                    }
                },
                {
                    "text": {
                        "text": [
                            "Ah, e você ganhou 50 pontos!"
                        ]
                    }
                }
            ]
        })
    }
    else if (intentName == "tripBookLocaleIntent") {
        const ids = params.ids
        const session = req.body.session
        const telephone = session.split(':').pop()

        const trucker_id = await connection('truckers').where('telephone', telephone).select('id')

        ids.forEach(async point_id => {
            await connection('bookings').insert({
                trucker_id: trucker_id[0].id,
                point_id, point_id
            })
        })

        res.json(genericFulfillmentMessageFormatter("Tudo certo! Você reservou estes pontos!"))
    }
    else if (intentName == "reportIntent") {
        const report = params.report
        const session = req.body.session
        const telephone = session.split(':').pop()

        const trucker_id = await connection('truckers').where('telephone', telephone).select('id')

        await connection('reports').insert({
            trucker_id: trucker_id[0].id,
            report: report
        })

        res.json(genericFulfillmentMessageFormatter("Sua denúncia foi enviada, pode ficar tranquilo agora"))
    }
    else {
        return res.json(genericFulfillmentMessageFormatter(`Tivemos alguns problemas nos nossos sistemas... Por favor tente mais tarde`))
    }
})



module.exports = routes