const mongoose = require('mongoose')
const config = require('./config')

const dbURI = config.dbUrl

const connectToDB = () => {
    mongoose.connect(dbURI)
        .then(() => {
            console.log("Connected to MongoDB")
        })
        .catch(err => console.log(err))
}

module.exports = connectToDB