const mongoose = require('mongoose')
const schema = mongoose.Schema

let course = new schema({
    name: {
        type: String,
        required: true
    },
    term: {
        type: String,
        required: true
    },
    language: {
        type: String
    },
    lecturer: {
        type: String
    },
    max_participants: {
        type: Number
    },
    organisational_unit: {
        type: String
    },
    events: {
        type: Array
    },
    lsf_id: {
        type: Number
    },
    type: {
        type: String
    }
})

const Course = mongoose.model('Course', course)

module.exports = Course