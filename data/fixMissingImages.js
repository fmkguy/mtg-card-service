const mongoose = require('mongoose');

const { MODEL_NAMES } = require('../src/lib/constants');

mongoose.connect(
  `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@mongo/mtg`,
  { useNewUrlParser: true }
);

require('../src/models/Card');

const Card = mongoose.model(MODEL_NAMES.CARD);

const query = { "imageUrls": { $exists: false } };

Card.find(query)
  .then(cards => {
    let i = 0;
    
    // Slow down the requests for the scryfall API
    const setCardData = () => {
      if (i < cards.length) {
        setTimeout(async () => {
          await cards[i].insertImages();
          cards[i++].save()
            .then(({name, imageUrls}) => console.log({name, imageUrls}))
            .catch(err => console.log(err));
          setCardData();
        }, 200);
      }
    }

    setCardData();
  })
  .catch(err => console.log(err));
