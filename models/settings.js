const { Schema, model } = require("mongoose");

module.exports = model("settings", new Schema({
    //String
    id: { type: String, default: "" },

    //Numbers
    number: { type: Number, default: 0 },
    duration: { type: Number, default: Date.now() },
}));