const express = require('express');
const {
  sendMessage,
  getConversations,
  getConversation
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes are protected

router.route('/')
  .post(sendMessage)
  .get(getConversations);

router.get('/:productId/:otherUserId', getConversation);

module.exports = router;
