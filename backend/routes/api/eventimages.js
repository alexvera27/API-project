const express = require('express');
const { Op } = require('sequelize')
const { Event, Venue, Group, Membership, GroupImage, EventImage, Attendance, User } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

const router = express.Router();

router.delete('/:imageId', requireAuth, async (req, res) => {
  const image = await EventImage.findByPk(req.params.imageId)
  if(!image) throw new Error("Cannot find image")

  const event = await Event.findByPk(image.eventId)

  const membership = await Membership.findOne({
    where:{
      userId: req.user.id,
      groupId: event.groupId,
      status: { [Op.in]: ['co-host', 'host'] }
    }
  })
  if(!membership) throw new Error("Not allowed to delete image")
  image.destroy()
  return res.json({message: "Deleted"})
})

module.exports = router;
