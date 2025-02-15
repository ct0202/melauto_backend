const { model, Schema, ObjectId } = require('mongoose');

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    role: {
      type: String,
      required: true  
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: String
});


const User = model('User', userSchema);
module.exports = { User };