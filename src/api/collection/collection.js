const router = require('express').Router();
const mongoose = require('mongoose');
const { FIELD_NAMES, MODEL_NAMES } = require('../../lib/constants');

const Card = mongoose.model(MODEL_NAMES.Card);

router.get('/', (req, res, next) => {
  res.json({
    message: 'Submit the collection as POST request in JSON body.'
  });
});

router.post('/', (req, res, next) => {
  const { cards } = req.body.query;
  const query = { "uuid": { $in: cards } };

  Promise.all([
    Card.find(query, null, { sort: { colorSortOrder: 1, manaCostSortOrder: 1, name: 1 } })
      .populate([
        FIELD_NAMES.priceData,
        FIELD_NAMES.setData
      ])
      .exec(),
    Card.estimatedDocumentCount(query).exec()
  ])
    .then(response => {
      const [cards, cardsCount] = response;

      res.json({
        data: {
          cards: cards.map(card => ({
            ...card._doc,
            priceData: card.priceData,
            setData: card.setData,
          })),
          cardsCount
        }
      });
    })
    .catch(next);
});

module.exports = router;
