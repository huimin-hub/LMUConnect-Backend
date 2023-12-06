const mongoose = require('mongoose')
const schema = mongoose.Schema

let news = new schema({
    _id: {
        type: String,
        required: true
    },

    title: {
        type: String,
        required: true
    },
    abstract: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String
    }
})

const News = mongoose.model('News', news)

module.exports = News