const mongoose = require("mongoose");
let ObjectId = mongoose.Schema.Types.ObjectId

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },

    lastName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    phone: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    address:{
        text:{type:String},
        city:{type:String},
        state:{type:String},
        country:{type:String}
    },

    location:{
        type:{type:String,enum:['Point'],default:'Point'},
        coordinates:{type:[Number]}
    } ,

    friends:[{
        userId:{type:ObjectId,ref:'User'},
        _id:0
    }],

    friendRequest:[{
        userId:{type:ObjectId,ref:'User'},
        _id:0
    }],
    otp:String

},{timestamps:true});

userSchema.index({"location":"2dsphere"});
module.exports = new mongoose.model("User",userSchema)