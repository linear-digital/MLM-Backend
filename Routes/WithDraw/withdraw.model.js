const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: [true, "Withdraw amount is required"],
    },
    status: {
        type: String,
        enum: ["pending", "completed", "rejected"],
        default: "pending",
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
    },
    image: {
        type: String
    }
}, { timestamps: true });

const Withdraw = mongoose.model("Withdraw", withdrawSchema);
module.exports = Withdraw