const mongoose = require("mongoose");

const NX_Schema = new mongoose.Schema({
    userName: String,
    userId: String,
    score: Number,
    lfg: Number,
    gm: Number,
    firstTimeSendMsg: Boolean,
    twitterId: String,
    messagesSent: Number,
    tagOpt: String,
    miniGames: {
        coinFlip: {
            wins: Number,
            losses: Number,
        },
        royaleBattle: {
            wins: Number,
            losses: Number,
            ties: Number,
        },
    },
});
module.exports = mongoose.model("nil-xp", NX_Schema);