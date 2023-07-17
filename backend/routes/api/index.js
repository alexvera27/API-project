const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');
const groupsRouter = require('./groups.js');
const venuesRouter = require('./venue.js');
const eventsRouter = require('./events.js');
const groupImagesRouter = require('./groupimages.js');
const eventImagesRouter = require('./eventimages.js');
const { restoreUser } = require("../../utils/auth.js");

// Connect restoreUser middleware to the API router
  // If current user session is valid, set req.user to the user in the database
  // If current user session is not valid, set req.user to null
router.use(restoreUser);

router.use('/session', sessionRouter);

router.use('/users', usersRouter);

router.post('/test', (req, res) => {
  res.json({ requestBody: req.body });
});

router.use('/groupimages', groupImagesRouter);

router.use('/eventimages', eventImagesRouter);

router.use('/events', eventsRouter);

router.use('/venue', venuesRouter);

router.use('/groups', groupsRouter);

module.exports = router;
