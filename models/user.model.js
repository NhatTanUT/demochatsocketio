const mongoose = require('mongoose')
const schema = mongoose.Schema
const bcrypt = require('bcrypt')
const Room = require('./room.model.js')


const userSchema = schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        min: 3,
        max: 255
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    name: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    rooms: [{
        type: String,
        ref: Room
    }],
    avatar: {
        type: String,
        required: true,
        default: '/img/anonymous-user.png'
    }
})

userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
// kiểm tra password có hợp lệ không
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);