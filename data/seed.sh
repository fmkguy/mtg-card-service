#! /bin/bash

export CARDS_FILE=${CARDS_FILE=AllPrintings.json}
export PRICES_FILE=${PRICES_FILE=AllPrices.json}
export WORKDIR=/usr/src/app/data

echo "Downloading $CARDS_FILE list from mtgjson..."
curl https://mtgjson.com/api/v5/$CARDS_FILE.gz -o $WORKDIR/$CARDS_FILE.gz
gunzip $WORKDIR/$CARDS_FILE.gz

echo "Running seed script..."
node $WORKDIR/index.js

echo "Downloading $PRICES_FILE list from mtgjson..."
curl https://mtgjson.com/api/v5/$PRICES_FILE.gz -o $WORKDIR/$PRICES_FILE.gz
gunzip $WORKDIR/$PRICES_FILE.gz

echo "Running prices script..."
node $WORKDIR/prices.js

echo "Cleaning up..."
rm $WORKDIR/$CARDS_FILE
rm $WORKDIR/$PRICES_FILE

echo "Fetching card images..."
node $WORKDIR/fixMissingImages.js

echo "All done!"