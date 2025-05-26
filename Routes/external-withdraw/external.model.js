const mongoose = require("mongoose");

const externalSchema = new mongoose.Schema({
    amount: {
        type: Number,
    },
    status: {
        type: String,
        enum: ["pending", "completed", "rejected"],
        default: "pending",
    },
    reason: {
        type: String
    },
    video: {
        type: String,
    },
    image: {
        type: String,
       
    },
    method: {
        type: String,
        required: [true, "Withdraw method is required"],
    },
    account: {
        type: String,
        required: [true, "Account is required"],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    }
}, { timestamps: true });

const External = mongoose.model("External", externalSchema);
module.exports = External