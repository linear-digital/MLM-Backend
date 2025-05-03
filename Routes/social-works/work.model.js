const mongoose = require("mongoose");

const workSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Work title is required"],
    },
    description: {
        type: String,
        required: [true, "Work description is required"],
    },
    duration: {
        type: Number,
        required: [true, "Work duration is required"],
    },
    url: {
        type: String,
        required: [true, "Work URL is required"],
    },
    price: {
        type: Number,
        required: [true, "Work price is required"],
    },
    questions: {
        type: Array,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    workers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User"
    }
}, {
    timestamps: true
});

const workSubmitSchema = new mongoose.Schema({
    workId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SocialWork",
        required: [true, "Work ID is required"],
    },
    answers: {
        type: Array,
        required: [true, "Answers are required"],
    },
    duration: {
        type: Number,
        required: [true, "Work duration is required"],
    },
    status: {
        type: String,
        enum: ["pending", "completed", "rejected"],
        default: "pending",
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
    },
}, {
    timestamps: true
});

const Work = mongoose.model("SocialWork", workSchema);
const WorkSubmit =  mongoose.model("WorkSubmit", workSubmitSchema);

module.exports = {
    Work,
    WorkSubmit
};