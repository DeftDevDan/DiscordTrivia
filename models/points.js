const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pointSchema = new Schema({
    _id: Schema.Types.ObjectId,
    user: { type: String, required: true },
    userId: { type: String, required: true },
    points: Number
});

const Points = mongoose.model("Points", pointSchema);

module.exports = Points;