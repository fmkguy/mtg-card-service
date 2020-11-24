const router = require('express').Router();
const mongoose = require('mongoose');
const { MODEL_NAMES } = require('../../lib/constants');

const Set = mongoose.model(MODEL_NAMES.Set);

router.get('/', (req, res, next) => {
  Set.find().sort({ releaseDate: 1 })
    .then(sets => res.json({ data: { sets } }))
    .catch(next);
});

router.get('/:code', (req, res, next) => {
  Set.findOne({ code: req.params.code })
    .then(set => res.json({ data: set }))
    .catch(next);
});

module.exports = router;
