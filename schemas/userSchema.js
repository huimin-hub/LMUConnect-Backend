const mongoose = require('mongoose')
const schema = mongoose.Schema

let user = new schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String
    },
    menuItems: {
        type: Array
    },
    profile: {
        type: Object
    },
    courses:
    {
        type: Array
    },
    friendsList: {
        type: Array
    },
    matrix: {
        type: Object
    },
    isAdmin: {
        type: Boolean
    }
}, )

const User = mongoose.model('User', user)

module.exports = User