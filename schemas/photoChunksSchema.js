const { ObjectId, Int32, Binary } = require('mongodb')
const mongoose = require('mongoose')
const schema = mongoose.Schema

let chunk = new schema({
    files_id: {
        type: ObjectId,
    },
    n: {
        type: Number,
    },
    data: {
        type: Buffer
    }
}, )

const Chunks = mongoose.model('Photos.chunks', chunk)

module.exports = Chunks