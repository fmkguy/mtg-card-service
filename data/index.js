const { streamObject } = require('stream-json/streamers/StreamObject');
const Pick = require('stream-json/filters/Pick');
const { chain } = require('stream-chain');
const { Writable } = require('stream');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const { MODEL_NAMES } = require('../src/lib/constants');

// Step 0: connect to db
mongoose.connect(
  `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@mongo/mtg`,
  { useNewUrlParser: true }
);

require('../src/models/Card');

const Card = mongoose.model(MODEL_NAMES.CARD);

// Step 1: Drop the initial collection
Card.collection.drop();

// Step 2: Stream the JSON file and insert the card objects into our database
const writeStream = new Writable({
  write({value}, encoding, callback) {
    let i = 0;
    
    // Slow down the requests for
    const setCardData = () => {
      if (i < value.cards.length) {
        setTimeout(() => {
          const card = new Card(value.cards[i++]);
      
          card.save()
            .then(({name, imageUrls}) => console.log({name, imageUrls}))
            .catch(err => console.log(err));
          setCardData();
        }, 200);
      }
    }

    setCardData();

    callback();
  },
  objectMode: true
});

const pipeline = chain([
  fs.createReadStream(path.join(__dirname, process.env.CARDS_FILE || 'AllPrintings.json')),
  Pick.withParser({ filter: 'data' }),
  streamObject(),
]);

pipeline.pipe(writeStream);

writeStream.on('finish', () => console.log(`All done!`));
