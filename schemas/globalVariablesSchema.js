const mongoose = require('mongoose')
const schema = mongoose.Schema

let globalVariable = new schema({
    identifier: {
        type: String,
        required: true
    },
    value: {
        type: Array
    }
}, )

const GlobalVariable = mongoose.model('GlobalVariable', globalVariable)

module.exports = GlobalVariable