#! /bin/bash

export CARDS_FILE=${CARDS_FILE=AllPrintings.json}
export WORKDIR=/usr/src/app/data

echo "Downloading $CARDS_FILE list from mtgjson..."
curl https://mtgjson.com/api/v5/$CARDS_FILE.gz -o $WORKDIR/$CARDS_FILE.gz
gunzip $WORKDIR/$CARDS_FILE.gz

echo "Running seed script..."
node $WORKDIR/index.js

echo "Cleaning up..."
rm $WORKDIR/$CARDS_FILE

echo "All done!"