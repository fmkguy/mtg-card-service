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

require('../src/models/Price');

const Price = mongoose.model(MODEL_NAMES.Price);

// Step 1: Drop the initial collection(s)
Price.collection.drop();

// Step 2: Stream the JSON file and insert the price objects into our database
const writeStream = new Writable({
  write({key, value}, encoding, callback) {
    const price = new Price({
      uuid: key,
      formats: value
    });

    price.save()
      .then(({uuid}) => console.log(`Saved price for ${uuid}`))
      .catch(err => console.log(`There was a problem saving the price data: ${err}`));

    callback();
  },
  objectMode: true
});

const pipeline = chain([
  fs.createReadStream(path.join(__dirname, process.env.PRICES_FILE || 'AllPrices.json')),
  Pick.withParser({ filter: 'data' }),
  streamObject(),
]);

pipeline.pipe(writeStream);

writeStream.on('finish', () => {
  console.log(`All done!`);
  process.exit();
});
