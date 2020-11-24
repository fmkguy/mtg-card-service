const mongoose = require('mongoose');
const { MODEL_NAMES } = require('../lib/constants');

const SetSchema = new mongoose.Schema({
  baseSetSize: Number,
  code: { type: String, index: true },
  isFoilOnly: Boolean,
  isOnlineOnly: Boolean,
  isPaperOnly: Boolean,
  name: String,
  releaseDate: { type: Date, index: true },
  totalSetSize: Number,
  type: String,
});

mongoose.model(MODEL_NAMES.Set, SetSchema);
