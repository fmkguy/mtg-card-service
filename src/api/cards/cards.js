const router = require('express').Router();
const mongoose = require('mongoose');
const { MODEL_NAMES } = require('../../lib/constants');
const { getColorQuery, getNumberQuery, getRarityQuery } = require('../../lib/utils');

const Card = mongoose.model(MODEL_NAMES.CARD);

function searchQuery(req, res, next) {
  const query = {};
  const {
    limit = 20,
    offset = 0,
    // COLORS
    c,colors,
    id,colorIdentity,
    colorIndicator,
    // NUMBERS
    cmc,
    power,
    toughness,
    // WORD SEARCH
    k,keywords,
    l,leadership,
    name,
    r,rarity,
    subtypes,
    supertypes,
    types,
    t,type,
    // GENERIC TEXT SEARCH
    q
  } = req.body.query || req.query;

  // COLORS
  if (c || colors) {
    query.colors = getColorQuery(c || colors);
  }
  if (id || colorIdentity) {
    query.colorIdentity = getColorQuery(id || colorIdentity);
  }
  if (colorIndicator) {
    const colorIndicatorList = colorIndicator.split('');
    query.colorIndicator = { $in: colorIndicatorList };
  }
  
  // CMC
  if (cmc) {
    query.convertedManaCost = getNumberQuery(cmc);
  }
  // POWER
  if (power) {
    query.power = getNumberQuery(power);
  }
  // TOUGHNESS
  if (toughness) {
    query.toughness = getNumberQuery(toughness);
  }
  
  // KEYWORDS
  if (k || keywords) {
    const keywordsList = k || keywords;
    query.keywords = { $in: keywordsList.split(',') };
  }

  // LEADERSHIP (can be Commander)
  if (l || leadership) {
    query[`leadershipSkills.${(l || leadership).toLowerCase()}`] = true;
  }

  // NAME
  if (name) {
    const nameStr = new RegExp(name, 'ig');
    query.name = { $regex: nameStr };
  }

  // RARITY
  if (r || rarity) {
    query.rarity = getRarityQuery(r || rarity);
  }

  // TYPES
  const typesList = types ? types.split(',') : null;
  const subtypesList = subtypes ? subtypes.split(',') : null;
  const supertypesList = supertypes ? supertypes.split(',') : null;
  if (subtypesList) {
    query.subtypes = { $in: subtypesList };
  }
  if (supertypesList) {
    query.supertypes = { $in: supertypesList };
  }
  if (typesList) {
    query.types = { $in: typesList };
  }
  
  // TYPE (more generic string search)
  if (t || type) {
    const typeList = t || type;
    const typeString = new RegExp(typeList.replace(',', ' '), 'ig');
    query.type = { $regex: typeString };
  }

  // BASIC TEXT SEARCH (name, text, type)
  if (q) {
    // to assist in finding cards that show the Tap symbol...
    const qTapped = (q.match(/\btap\b/, 'ig')) ? `${q} {T}` : q;
    query.$text = { $search: qTapped }
  }

  console.log({ query, params: req.query });

  Promise.all([
    Card.find(query)
      .sort({ colorSortOrder: 1, manaCostSortOrder: 1, name: 1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .exec(),
    Card.estimatedDocumentCount(query).exec()
  ])
    .then(results => {
      const [ cards, cardsCount ] = results;

      return res.json({
        data: {
          cards,
          cardsCount
        }
      });
    })
    .catch(next);
}

// accepts query as URL query params
router.get('/', searchQuery);

// accepts query as JSON body
router.post('/', searchQuery);

router.get('/:id', (req, res, next) => {
  Card.findOne({ uuid:req.params.id })
    .then(results => res.json({data: results}))
    .catch(next);
});

module.exports = router;
