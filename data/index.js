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
  process.env.DB_URL,
  { useNewUrlParser: true }
);

require('../src/models/Set');
require('../src/models/Card');

const Set = mongoose.model(MODEL_NAMES.Set);
const Card = mongoose.model(MODEL_NAMES.Card);

// Step 1: Drop the initial collection(s)
Card.collection.drop();
Set.collection.drop();

// Step 2: Stream the JSON file and insert the card objects into our database
const writeStream = new Writable({
  write({value}, encoding, callback) {
    let i = 0;

    const setData = new Set({
      baseSetSize: value.baseSetSize,
      code: value.code,
      isFoilOnly: value.isFoilOnly,
      isOnlineOnly: value.isOnlineOnly,
      isPaperOnly: value.isPaperOnly,
      name: value.name,
      releaseDate: value.releaseDate,
      totalSetSize: value.totalSetSize,
      type: value.type,
    });
    
    setData.save()
      .then(() => {
        value.cards.forEach(doc => {
          const card = new Card(doc);
          // save and log the card names
          card.save()
            .then(({name}) => console.log({name}))
            .catch(err => console.log(err));
        });
      })
      .catch(err => console.log(err));

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

writeStream.on('finish', () => {
  console.log(`Initial card insertions: complete!`)
  process.exit();
});

