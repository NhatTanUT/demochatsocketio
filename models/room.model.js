const mongoose = require('mongoose')
const schema = mongoose.Schema
const bcrypt = require('bcrypt')
const User = require('./user.model.js')

const roomSchema = schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        min: 3,
        max: 255
    },
    message: [{
        content: {
            type: String,
            min: 1, 
            max: 255
        },
        author: {
            type: String,
            ref: 'User'
        },
        time: {
            type: Date
        }
    }]
})

module.exports = mongoose.model('Room', roomSchema);