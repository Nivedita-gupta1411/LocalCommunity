const express = require('express');
const {
  createOffer,
  getOffers,
  acceptOffer,
  rejectOffer,
  counterOffer,
  withdrawOffer
} = require('../controllers/offerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createOffer)
  .get(getOffers);

router.patch('/:id/accept', acceptOffer);
router.patch('/:id/reject', rejectOffer);
router.patch('/:id/counter', counterOffer);
router.patch('/:id/withdraw', withdrawOffer);

module.exports = router;
