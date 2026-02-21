const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    number: { type: Number, required: true },
    districts: [{
        name: String,
        sectors: [String],
    }],
});

module.exports = mongoose.model('Province', provinceSchema);
