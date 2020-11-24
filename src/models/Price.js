const mongoose = require('mongoose');
const { MODEL_NAMES } = require('../lib/constants');

const PriceSchema = new mongoose.Schema({
  uuid: { type: String, index: true },
  formats: { type: mongoose.Schema.Types.Mixed }
});

mongoose.model(MODEL_NAMES.Price, PriceSchema);
