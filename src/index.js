const express = require('express');
const mongoose = require('mongoose');

const app = express();

mongoose.connect(
  `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@mongo/mtg`,
  { useNewUrlParser: true }
);

require('./models/Card');

// MIDDLEWARES
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'https://i.imgur.com/IlweEFM.gif'
  });
});

app.use('/api/v1', require('./api'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});