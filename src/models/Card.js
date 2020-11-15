const mongoose = require('mongoose');
const fetch = require('node-fetch');
const { MODEL_NAMES } = require('../lib/constants');

const ForeignDataSchema = new mongoose.Schema({
  faceName: String,
  flavorText: String,
  language: String,
  multiverseId: String,
  name: String,
  text: String,
  type: String
});

const IdentifiersSchema = new mongoose.Schema({
  cardKingdomFoilId: String,
  cardKingdomId: String,
  mcmId: String,
  mcmMetaId: String,
  mtgArenaId: String,
  mtgoFoilId: String,
  mtgoId: String,
  mtgjsonV4Id: String,
  multiverseId: String,
  scryfallId: String,
  scryfallOracleId: String,
  scryfallIllustrationId: String,
  tcgplayerProductId: String
});

// populated by request to scryfall api
const ImageUrlsSchema = new mongoose.Schema({
  png: String,
  border_crop: String,
  art_crop: String,
  large: String,
  normal: String,
  small: String
});

const leadershipSkillsSchema = new mongoose.Schema({
  brawl: Boolean,
  commander: Boolean,
  oathbreaker: Boolean
});

const LegalitiesSchema = new mongoose.Schema({
  brawl: String,
  commander: String,
  duel: String,
  future: String,
  frontier: String,
  legacy: String,
  modern: String,
  pauper: String,
  penny: String,
  pioneer: String,
  standard: String,
  vintage: String
});

const PurchaseUrlsSchema = new mongoose.Schema({
  cardKingdom: String,
  cardKingdomFoil: String,
  cardmarket: String,
  tcgplayer: String
});

const RulingsSchema = new mongoose.Schema({
  date: String,
  text: String
});

const CardSchema = new mongoose.Schema({
  artist: String,
  asciiName: String,
  availability: [String],
  borderColor: String,
  colorIdentity: { type: [String], index: true },
  colorIndicator: { type: [String], index: true },
  colors: { type: [String], index: true },
  colorSortOrder: { type: Number, index: true },
  convertedManaCost: { type: String, index: true },
  count: Number,
  dualDeck: String,
  edhrecRank: Number,
  faceConvertedManaCost: String,
  faceName: String,
  flavorName: String,
  flavorText: String,
  foreignData: [ForeignDataSchema],
  frameEffects: [String],
  frameVersion: String,
  hand: String,
  hasContentWarning: Boolean,
  hasFoil: Boolean,
  hasAlternateDeckLimit: Boolean,
  hasNonFoil: Boolean,
  identifiers: IdentifiersSchema,
  imageUrls: [ImageUrlsSchema],
  isAlternate: Boolean,
  isFoil: Boolean,
  isFullArt: Boolean,
  isOnlineOnly: Boolean,
  isOversized: Boolean,
  isPromo: Boolean,
  isReprint: Boolean,
  isReserved: Boolean,
  isStarter: Boolean,
  isStorySpotlight: Boolean,
  isTextless: Boolean,
  isTimeshifted: Boolean,
  keywords: { type: [String], index: true },
  layout: String,
  leadershipSkills: leadershipSkillsSchema,
  legalities: LegalitiesSchema,
  life: String,
  loyalty: String,
  manaCost: { type: String, index: true },
  manaCostSortOrder: { type: Number, index: true },
  name: { type: String, index: true },
  number: String,
  originalText: String,
  originalType: String,
  otherFaceIds: [String],
  power: { type: String, index: true },
  printings: [String],
  promoTypes: [String],
  purchaseUrls: PurchaseUrlsSchema,
  rarity: { type: String, index: true },
  rulings: [RulingsSchema],
  setCode: String,
  side: String,
  subtypes: { type: [String], index: true },
  supertypes: { type: [String], index: true },
  text: String,
  toughness: { type: String, index: true },
  type: String,
  types: { type: [String], index: true },
  uuid: { type: String, index: true },
  variations: [String],
  watermark: String
});

CardSchema.index({
  name: 'text',
  text: 'text',
  type: 'text'
});

CardSchema.methods.insertImages = async function() {
  this.imageUrls = await fetch(`https://api.scryfall.com/cards/${this.identifiers.scryfallId}`, {
    mode: 'cors',
    headers: {
      accept: 'application/json'
    }
  })
    .then(res => res.json())
    .then(({card_faces, image_uris}) => {
      let images = [];
      if (image_uris) {
        images.push(image_uris);
      } else if (card_faces) {
        card_faces.map(async face => await images.push(face.image_uris));
      }
      return images.length ? images : null;
    })
    .catch(err => console.log('`${this.name}`', err));
}

CardSchema.methods.setManaCostSortOrder = function() {
  // Cards with "X" in their mana costs should appear at the end of the list
  // valid inputs as "{X}{W}" or "XW"
  const xVal = 20 * [...this.manaCost.matchAll(/({?X}?)/gi)].length;
  this.manaCostSortOrder = Number(this.convertedManaCost) + xVal;
}

CardSchema.methods.setColorSortOrder = function() {
  // ensures all cards receieve a "color" value for sorting
  // "colorless" should appear after all other colors and color pairings
  const colorValues = {
    W: 1,
    U: 2,
    B: 4,
    R: 8,
    G: 16,
    C: 999
  }
  const colorsArr = this.colors;
  const lengthMultiplier = colorsArr.length;
  this.colorSortOrder = colorsArr.reduce((acc, cur) => acc + colorValues[cur], 0) * lengthMultiplier;
}

CardSchema.pre('validate', function(next) {
  // if no color is assigned, assume "colorless"
  if (!this.colors || this.colors.length <= 0) {
    this.colors = ['C'];
  }

  next();
});

CardSchema.pre('save', async function(next) {
  if (!this.imageUrls || !this.imageUrls.length) {
    await this.insertImages();
  }

  if (!this.colorSortOrder) {
    this.setColorSortOrder();
  }

  next();
});

mongoose.model(MODEL_NAMES.CARD, CardSchema);
