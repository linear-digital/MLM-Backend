const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        minlength: 5,
        required: [true, "Username is required (minimum 5 characters)"],
    },
    
    email: {
        type: String,
        required: [true, "Please Enter Your Email"],
        unique: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    status: {
        type: String,
        enum: ["pending", "active", "inactive"],
        default: "pending",
    },
    name: {
        type: String,
        required: [true, "Please Enter Your Name"],
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        default: "Male"
    },
    education: {
        type: String,
       default: "Other"
    },
    phone: {
        type: String,
        required: [true, "Please enter your phone number"],
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password"],
        minlength: 6,
    },
    paymentMethod: {
        type: String,
        default: "Bkash"
    },
    account: {
        type: String,
        default: "0000000"
    },
    trx: {
        type: String,
        default: "ERROR"
    },
    time: {
        type: Date,
        default: Date.now
    },
    reffer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    fbId: {
        type: String,
        required: [true, "Facebook ID is required"],
    },
    balance: {
        type: Number,
        default: 0
    },
    lock: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date
    },
    level: {
        type: Number,
        default: 1
    },
}, {
    timestamps: true,
});
const User = mongoose.model("User", userSchema);
module.exports = User;
