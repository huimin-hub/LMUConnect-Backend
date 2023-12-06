const { ObjectId, Int32, Binary } = require('mongodb')
const mongoose = require('mongoose')
const schema = mongoose.Schema

let file = new schema({
    length: {
        type: Number,
    },
    chunkSize: {
        type: Number,
    },
    uploadDate: {
        type: Date
    },
    filename: {
        type: String
    },
    contentType: {
        type: String
    }
}, )

const Files = mongoose.model('Photos.files', file)

module.exports = Files