const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServiceSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        price: {
            type: Number,
            required: true
        },
        duration: {
            type: String
        },
        // New fields for ratings and reviews
        reviews: [{
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }],
        averageRating: {
            type: Number,
            default: 0
        },
        numberOfReviews: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);