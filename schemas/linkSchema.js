const mongoose = require('mongoose')
const schema = mongoose.Schema

let link = new schema({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true,
        unique: true
    },
    img: {
        type: String
    }
}, )

const Link = mongoose.model('Link', link)

module.exports = Link