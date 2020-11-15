const { RARITIES } = require('./constants');

/**
 * 
 * @param {string} query 
 * @returns {object} Mongoose query object
 */
function getColorQuery(query) {
  const [ _, operator, colorsList = [] ] = new RegExp(/([\W]*)([WUBRGC]*)/,'i').exec(query);
  let colors = {};
  
  switch (operator) {
    case "<=":
      // TODO: still need to figure this one out
      // at most, only these colors
      colors = { $in: colorsList.split('') };
      break;
    
    case ">=":
      // includes these colors
      colors = { $in: colorsList.split('') };
      break;

    default:
      // exactly these colors
      // have to sort the input to EXACTLY match the db results
      colors = { $eq: colorsList.split('').sort() };
      break;
  }
  return colors;
}

/**
 * 
 * @param {string} query
 * @returns {object} Mongoose query object
 */
function getNumberQuery(query) {
  const [ _, operator, value ] = new RegExp(/([\W]*)([0-9\*]+)/, 'i').exec(query);
  const numValue = value === '*' ? '0' : value;
  let numbers = {}

  switch (operator) {
    case ">":
      numbers = { $gt: numValue };
      break;

    case ">=":
      numbers = { $gte: numVal };
      break;

    case "<":
      numbers = { $lt: numValue };
      break;
    
    case "<=":
      numbers = { $lte: numValue };
      break;

    default:
      // allows user to search for '*' literals
      numbers = { $eq: value };
      break;
  }
  return numbers;
}

/**
 * 
 * @param {string} query 'common'|'uncommon'|'rare'|'mythic'
 * @returns {object} Mongoose query object
 */
function getRarityQuery(query) {
  const [ _, operator, value ] = new RegExp(/([\W]*)([un]*common|rare|mythic)/).exec(query);
  const rarityValues = [
    RARITIES.COMMON,
    RARITIES.UNCOMMON,
    RARITIES.RARE,
    RARITIES.MYTHIC
  ];
  let rarity = {};

  switch (operator) {
    case ">":
      rarity = { $in: rarityValues.slice(rarityValues.indexOf(value.toLowerCase())+1, rarityValues.length) };
      break;

    case ">=":
      rarity = { $in: rarityValues.slice(rarityValues.indexOf(value.toLowerCase()), rarityValues.length) };
      break;

    case "<":
      rarity = { $in: rarityValues.slice(0, rarityValues.indexOf(value.toLowerCase())) };
      break;
    
    case "<=":
      rarity = { $in: rarityValues.slice(0, rarityValues.indexOf(value.toLowerCase())+1) };
      break;
  
    default:
      rarity = { $eq: value };
      break;
  }
  return rarity;
}

module.exports = {
  getColorQuery,
  getNumberQuery,
  getRarityQuery
}
