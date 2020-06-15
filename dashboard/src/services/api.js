import axios from 'axios'

const api = axios.create({
    baseURL: 'https://300f249808e0.ngrok.io' // Link may change, local development only
})

export default api