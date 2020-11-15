const router = require('express').Router();
const mongoose = require('mongoose');
const { MODEL_NAMES } = require('../../lib/constants');

const Card = mongoose.model(MODEL_NAMES.CARD);

router.get('/', (req, res, next) => {
  res.json({
    message: 'Submit the collection as POST request in JSON body.'
  });
});

router.post('/', (req, res, next) => {
  const { cards } = req.body.query;
  const query = { "uuid": { $in: cards } };

  Promise.all([
    Card.find(query)
      .sort({ colorSortOrder: 1, manaCostSortOrder: 1, name: 1 })
      .exec(),
    Card.count(query).exec()
  ])
    .then(response => {
      const [cards, cardsCount] = response;

      res.json({
        data: {
          cards,
          cardsCount
        }
      });
    })
    .catch(next);
});

module.exports = router;
