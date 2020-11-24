const router = require('express').Router();

router.use('/sets', require('./sets/sets'));
router.use('/cards', require('./cards/cards'));
router.use('/collection', require('./collection/collection'));

module.exports = router;
