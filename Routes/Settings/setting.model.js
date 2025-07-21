const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Setting name is required"],
    },
    siteName: {
        type: String,
        required: [true, "Setting siteName is required"],
    },
    siteLogo: {
        type: String,
        default: ""
    },
    ref_comm: {
        gen1: {
            type: Number,
            default: 20
        },
        gen2: {
            type: Number,
            default: 10
        },
        gen3: {
            type: Number,
            default: 5
        },
        gen4: {
            type: Number,
            default: 1
        },
        gen5: {
            type: Number,
            default: 1
        },
        gen6: {
            type: Number,
            default: 1
        },
    },
    accounts: {
        phone: {
            type: String
        },
        whatsapp: {
            type: String
        },
        email: {
            type: String
        },
        bkash: {
            type: String
        },
        nagad: {
            type: String
        },
        rocket: {
            type: String
        },
        upay: {
            type: String
        },
        payeer: {
            type: String
        }
    },
    links: {
        whatsapp: {
            type: String
        },
        telegram: {
            type: String
        },
        facebook: {
            type: String
        },
        page: {
            type: String
        },
        video: {
            type: String
        }
    },
    register: {
        type: Boolean,
        default: true
    },
    ht_video:{
        type: String
    },
    acAmm:{
        type: String
    },
    
    withdraw: {
        type: Boolean,
        default: true
    },
    copyright: {
        type: String
    },
    notice: {
        type: String
    },
}, {
    timestamps: true
});
const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;