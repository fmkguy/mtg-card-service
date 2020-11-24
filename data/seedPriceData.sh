#! /bin/bash

export PRICES_FILE=${PRICES_FILE=AllPrices.json}
export WORKDIR=/usr/src/app/data

echo "Downloading $PRICES_FILE list from mtgjson..."
curl https://mtgjson.com/api/v5/$PRICES_FILE.gz -o $WORKDIR/$PRICES_FILE.gz
gunzip $WORKDIR/$PRICES_FILE.gz

echo "Running seed script..."
node $WORKDIR/prices.js

echo "Cleaning up..."
rm $WORKDIR/$PRICES_FILE

echo "All done!"