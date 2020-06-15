const express = require('express')
const cors = require('cors')
const routes = require('./routes')
const axios = require('axios')

const app = express() 

app.use(cors()) 
app.use(express.json())
app.use(routes)

app.listen(3333, (err, result) => {
    if (err) return result
    return console.log("Server running on 3333")
})
