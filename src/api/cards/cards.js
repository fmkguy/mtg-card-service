const router = require('express').Router();
const mongoose = require('mongoose');
const { DB_COLLECTIONS, FIELD_NAMES, MODEL_NAMES } = require('../../lib/constants');
const { getColorQuery, getNumberQuery, getRarityQuery } = require('../../lib/utils');

const Card = mongoose.model(MODEL_NAMES.Card);

function queryBuilder(request) {
  const query = {};
  const options = {};
  const {
    // UTILITY
    limit = 20,
    skip = 0,
    d,distinct,
    s,sort,
    o,order,
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
  } = request;

  // COLORS
  if (c || colors) {
    query.colors = getColorQuery(c || colors);
  }
  if (id || colorIdentity) {
    query.colorIdentity = getColorQuery(id || colorIdentity);
  }
  if (colorIndicator) {
    query.colorIndicator = { $in: colorIndicator.split('') };
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
    query.keywords = { $in: (k || keywords).split(',') };
  }

  // LEADERSHIP (can be Commander)
  if (l || leadership) {
    query[`${FIELD_NAMES.leadershipSkills}.${(l || leadership).toLowerCase()}`] = true;
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
  if (subtypes) {
    query.subtypes = { $in: subtypes.split(',') };
  }
  if (supertypes) {
    query.supertypes = { $in: supertypes.split(',') };
  }
  if (types) {
    query.types = { $in: types.split(',') };
  }
  
  // TYPE (more generic string search)
  if (t || type) {
    const typeString = new RegExp((t || type).replace(',', ' '), 'ig');
    query.type = { $regex: typeString };
  }

  // BASIC TEXT SEARCH (name, text, type)
  if (q) {
    // to assist in finding cards that show the Tap symbol...
    const qTapped = (q.match(/\btap\b/, 'ig')) ? `${q} {T}` : q;
    query.$text = { $search: qTapped }
  }
  
  options.skip = Number(skip);

  // Allows for "bypass" around defaults to get all results
  if (limit != '-1') {
    options.limit = Number(limit);
  }
  
  // set primary sort order
  options.sort = { colorSortOrder: 1, manaCostSortOrder: 1, name: 1 };
  
  console.log({ query, options, params: request });
  
  return {
    query,
    options,
    distinct: d || distinct || FIELD_NAMES.uuid,
    subSort: s || sort,
    order: o || order || 'asc'
  }
}

function searchQuery(req, res, next) {
  const request = req.body.query || req.query;

  // Short-circuit if search query is empty
  if (Object.keys(request).length === 0 || typeof request === 'undefined') {
    return res.status(400).json({ error: { message: 'Request body cannot be empty.' } });
  }

  const {
    query,
    options: {
      limit,
      skip,
      sort
    },
    distinct,
    subSort,
    order } = queryBuilder(request);

  const orderVal = {
    asc: 1,
    desc: -1
  };

  const pipeline = [
    // Actually do the lookup
    { $match: query },
      
    // "hydrate" with set and price data
    { $lookup: {
      from: DB_COLLECTIONS.sets,
      localField: FIELD_NAMES.setCode,
      foreignField: FIELD_NAMES.code,
      as: FIELD_NAMES.setData
    } },
    { $lookup: {
      from: DB_COLLECTIONS.prices,
      localField: FIELD_NAMES.uuid,
      foreignField: FIELD_NAMES.uuid,
      as: FIELD_NAMES.priceData
    } },
  ];

  // sort cards by set release date (key has to be hard-coded string)
  if (subSort === FIELD_NAMES.releaseDate) {
    pipeline.push({ $sort: { 'setData.releaseDate': orderVal[order] } });
  }

  // TODO: See if the card key can be replaced using "replaceRoot"/"newRoot"
  // group by "distinct" value ['uuid', 'name']
  pipeline.push(
    { $group: {
      _id: `$${distinct}`,
      card: { $first: '$$ROOT' }
    } }
  );
  
  // reformat card object after grouping
  pipeline.push(
    { $project: {
      _id: '$card._id',
      ...Object.keys(Card.schema.obj)
        .reduce((obj, key) => {
          obj[key] = `$card.${key}`;
          return obj;
        }, {}),
      setData: { $arrayElemAt: ['$card.setData', 0] },
      priceData: { $arrayElemAt: ['$card.priceData', 0] }
    } }
  );

  pipeline.push({ $sort: sort });

  if (typeof skip === 'number') {
    pipeline.push({ $skip: skip });
  }
  if (typeof limit === 'number') {
    pipeline.push({ $limit: limit });
  }

  Promise.all([
    Card.aggregate(pipeline)
      .allowDiskUse(true).exec(),
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
  Card.findOne({ uuid: req.params.id })
    .populate([
      FIELD_NAMES.setData,
      FIELD_NAMES.priceData
    ])
    .then(card => res.json({
      data: {
        card: {
          ...card._doc,
          setData: card.setData,
          priceData: card.priceData
        }
      }
    }))
    .catch(next);
});

module.exports = router;
