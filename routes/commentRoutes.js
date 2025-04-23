const express = require('express');
const { addComment, getComments } = require('../controllers/commentController');
const router = express.Router();

router.post('/', addComment);
router.get('/:productId', getComments);

module.exports = router;
