const express = require('express');
const { Op } = require('sequelize')
const { Venue, Membership, Group } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

const router = express.Router();

router.put('/:venueId', requireAuth, async (req, res) => {
  const { address, city, state, lat, lng } = req.body

  let auth = false

  const venue = await Venue.findOne({
    where: {
      id: req.params.venueId
    },
    attributes: {
      exclude: ['createdAt', 'updatedAt']
    }
  })

  if (!venue) throw new Error("Cannot find venue");

  const group = await Group.findByPk(venue.groupId)

  if(group.organizerId === req.user.id){
    auth = true;
  }

  const member = await Membership.findAll({
    where: {
      groupId: group.id,
      status: 'co-host',
      userId: req.user.id
    }
  })
  if(member) auth = true
  if(auth === false) throw new Error("Cannot find venue");

  if(address) venue.address = address
  if(city) venue.city = city
  if(state) venue.state = state
  if(lat) venue.lat = lat
  if(lng) venue.lng = lng

  venue.save();

  const response = {};

  return res.json(venue)

})

module.exports = router;
