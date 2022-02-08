const { Schema, model } = require("mongoose");

module.exports = model("cosmic_scores", new Schema({
    //String
    id: { type: String, default: "" },
    score: { type: Number, default: 0 },
}));