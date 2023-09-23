const express = require('express');
const { Op } = require('sequelize')
const { Group, Membership, GroupImage, Venue, Event, User, Attendance, EventImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

const router = express.Router();

router.get('/current', requireAuth, async (req, res) => {
  let member = await Membership.findAll({
    where: {
      userId: req.user.id
    },
    attributes: ['groupId']
  })
  let groupIds = member.map(member => member.get('groupId'))
  let groups = await Group.findAll({
    where: {
      [Op.or]: [
        { organizerId: req.user.id },
        { id: { [Op.in]: groupIds } }
      ]
    }
  });
  let groupArray = await Promise.all(groups.map(async group => {
    const numMembers = await group.getMemberships();
    const imageArray = await group.getGroupImages({
      where: {
        preview: true
      },
      limit: 1,
      attributes: ['url']
    });
    let image = imageArray[0]
    group = group.toJSON(),
      group.numMembers = numMembers.length
    if (image) group.previewImage = image.url
    return group
  }))

  let Groups = groupArray

  return res.json({ Groups })
})

router.get('/:groupId/events', async (req, res) => {
  const group = await Group.findOne({
    where: {
      id: req.params.groupId
    },
    attributes: ['id', 'name', 'city', 'state']
  })
  if (!group) throw new Error("Cannot find group")

  let Events = await Event.findAll({
    where: {
      groupId: group.id
    },
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'description', 'capacity','price']
    }
  })
  Events = await Promise.all(Events.map(async event => {
    event = event.toJSON();
    const venue = await Venue.findOne({
      where: {
        id: event.venueId
      },
      attributes: ['id', 'city', 'state']
    })
    const members = await Attendance.findAll({
      where: {
        eventId: event.id
      }
    })
    const image = await EventImage.findOne({
      where: {
        eventId: event.id,
        preview: true
      }
    })
    event.Group = group
    event.Venue = venue
    event.numAttending = members.length
    if(image) event.previewImage = image.url
    else event.previewImage = null

    return event
  }))

  res.json({ Events })
})

router.get('/:groupId/venues', requireAuth, async (req, res) => {
  const group = await Group.findByPk(req.params.groupId)
  if (!group) throw new Error("Group cannot be found")
  const member = await Membership.findAll({
    where: {
      userId: req.user.id,
      status: 'co-host'
    },
    attributes: ['groupId']
  })
  const groupIds = member.map(member => member.get('groupId'))

  const groups = await Group.findAll({
    where: {
      [Op.or]: [
        { organizerId: req.user.id },
        { id: { [Op.in]: groupIds } }
      ],
    },
    attributes: ['id']
  });
  const ids = groups.map(id => id.get('id'));

  const Venues = await Venue.findAll({
    where: {
      [Op.and]: [
        { groupId: { [Op.in]: ids } },
        { groupId: req.params.groupId }
      ]
    },
    attributes: {
      exclude: ['createdAt', 'updatedAt']
    }
  })

  res.json({ Venues })
})

router.get('/:groupId/members', async (req, res) => {
  const group = await Group.findByPk(req.params.groupId);
  if (!group) throw new Error("Group couldn't be found");

  const member = await Membership.findAll({
    where: {
      status: { [Op.in]: ['co-host', 'host'] },
      groupId: req.params.groupId
    },
    attributes: ['userId']
  });

  const members = await Membership.findAll({
    where: {
      groupId: req.params.groupId
    },
    attributes: ['userId']
  });

  let Members = [];
  const ownerIds = member.map(member => member.userId);

  if (req.user && ownerIds.includes(req.user.id)) {
    Members = await Promise.all(members.map(async member => {
      let userInfo = await User.findOne({
        where: {
          id: member.userId
        },
        attributes: ['id', 'firstName', 'lastName']
      });
      const memberstatus = await Membership.findOne({
        where: {
          userId: member.userId,
          groupId: req.params.groupId
        },
        attributes: ['status']
      });
      userInfo = userInfo.toJSON();
      userInfo.Membership = memberstatus;
      return userInfo;
    }));

    return res.json({Members});
  } else {
    Members = await Promise.all(members.map(async member => {
      let userInfo = await User.findOne({
        where: {
          id: member.userId
        },
        attributes: ['id', 'firstName', 'lastName']
      });
      const memberstatus = await Membership.findOne({
        where: {
          userId: member.userId,
          status: { [Op.notIn]: ['pending'] },
          groupId: req.params.groupId
        },
        attributes: ['status']
      });
      if (memberstatus) {
        userInfo = userInfo.toJSON();
        userInfo.Membership = memberstatus;
        return userInfo;
      }
    }));
    Members = Members.filter(Boolean)
    return res.json({ Members });
  }
});

router.get('/:groupId', async (req, res) => {
  let group = await Group.findByPk(req.params.groupId)
  const numMembers = await group.getMemberships();
  const imageArray = await group.getGroupImages({
    attributes: ['id', 'url', 'preview']
  });
  const organizer = await group.getUser({
    attributes: ['id', 'firstName', 'lastName']
  })
  const venues = await group.getVenues({
    attributes: ['id', 'groupId', 'address', 'city', 'state', 'lat', 'lng']
  });
  group = group.toJSON(),
    group.numMembers = numMembers.length
  if (imageArray) group.GroupImages = imageArray
  group.Organizer = organizer
  if (venues) group.Venues = venues;
  return res.json(group)
})

router.get('/', async (req, res) => {
  let groups = await Group.findAll();

  let groupArray = await Promise.all(groups.map(async group => {
    const numMembers = await group.getMemberships();
    const imageArray = await group.getGroupImages({
      where: {
        preview: true
      },
      limit: 1,
      attributes: ['url']
    });
    let image = imageArray[0]
    group = group.toJSON(),
      group.numMembers = numMembers.length
    if (image) group.previewImage = image.url
    else group.previewImage = null
    return group
  }))

  let Groups = groupArray

  return res.json({ Groups })
});

router.post('/:groupId/images', requireAuth, async (req, res) => {
  const { url, preview } = req.body;
  const group = await Group.findByPk(req.params.groupId)
  if (!group) throw new Error("Group couldn't be found")
  if (req.user.id !== group.organizerId) throw new Error('Must be owner of group')

  const image = await GroupImage.create({
    groupId: req.params.groupId,
    url,
    preview
  })

  const imageJson = {}
  imageJson.id = image.id
  imageJson.url = image.url
  imageJson.preview = image.preview

  return res.json( imageJson )

})

router.post('/:groupId/venues', requireAuth, async (req, res) => {

  const { address, city, state, lat, lng } = req.body;

  const group = await Group.findByPk(req.params.groupId)
  if(!group) throw new Error("Group couldn't be found")


  const member = await Membership.findAll({
    where: {
      userId: req.user.id,
      status: 'co-host'
    },
    attributes: ['groupId']
  })
  const groupIds = member.map(member => member.get('groupId'))

  const groups = await Group.findAll({
    where: {
      [Op.or]: [
        { organizerId: req.user.id },
        { id: { [Op.in]: groupIds } }
      ],
      id: req.params.groupId
    },
    attributes: ['id']
  });

  const id = groups.map(id => id.get('id'));
  if (!id) throw new Error("Group couldn't be found")

  const venue = await Venue.create({
    groupId: req.params.groupId,
    address,
    city,
    state,
    lat,
    lng
  })

  const response = {}

  response.id = venue.id
  response.groupId = venue.groupId
  response.address = venue.address
  response.city = venue.city
  response.state = venue.state
  response.lat = venue.lat
  response.lng = venue.lng

  res.json(response)
})

router.post('/:groupId/events', requireAuth, async (req, res) => {
  const { venueId, name, type, capacity, price, description, startDate, endDate } = req.body;
  const venue = await Venue.findByPk(venueId)
  const group = await Group.findByPk(req.params.groupId)
  if(!group) throw new Error("Group couldn't be found")

  if (!venue && venueId !== null) throw new Error("Venue does not exist")
  if (name.length < 5) throw new Error("Name must be longer than 4 characters")
  if (type !== 'Online' && type !== 'In person') throw new Error("Specify In person")
  if (typeof capacity !== 'number') throw new Error('Must be a number')
  if (typeof price !== 'number') throw new Error('Price shold be a number')
  if (!description) throw new Error("Add description")
  let date = new Date()
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (parsedStartDate.getTime() <= date.getTime()) throw new Error("Start date must be in the future");
  if (parsedStartDate.getTime() >= parsedEndDate.getTime()) throw new Error("End date is less than start date");

  const member = await Membership.findAll({
    where: {
      userId: req.user.id,
      status: 'co-host'
    },
    attributes: ['groupId']
  })
  const groupIds = member.map(member => member.get('groupId'))

  const groups = await Group.findAll({
    where: {
      [Op.or]: [
        { organizerId: req.user.id },
        { id: { [Op.in]: groupIds } }
      ],
      id: req.params.groupId
    },
    attributes: ['id']
  });

  const id = groups.map(id => id.get('id'));
  if (!id) throw new Error("Bad request")

  const event = await Event.create({
    groupId: Number(req.params.groupId),
    venueId,
    name,
    type,
    capacity,
    price,
    description,
    startDate,
    endDate
  })
  const response = {
    id: event.id,
    venueId,
    name,
    type,
    capacity,
    price,
    description,
    startDate,
    endDate
  }

  res.json(response)
})

router.post('/:groupId/membership', requireAuth, async (req, res) => {

  const members = await Membership.findAll({
    where: {
      groupId: req.params.groupId
    }
  })
  if (!members.length) throw new Error("Group couldn't be found")
  const isMember = await Membership.findOne({
    where: {
      groupId: req.params.groupId,
      userId: req.user.id
    }
  })
  if(isMember){
    if (isMember.status === 'pending') throw new Error("Pending approval")
    else throw new Error("You are already in this group")
  }

  const member = await Membership.create({
    userId: req.user.id,
    groupId: req.params.groupId,
    status: 'pending'
  })

  const application = {}
  application.memberId = req.user.id;
  application.status = member.status;

  return res.json({ application })
})

router.post('/', requireAuth, async (req, res) => {
  const { name, about, type, private, city, state } = req.body;
  const Groups = await Group.create({
    organizerId: req.user.id,
    name,
    about,
    type,
    private,
    city,
    state
  })
  const Member = await Membership.create({
    userId: req.user.id,
    groupId: Groups.id,
    status: 'host'
  })

  return res.json(Groups)
})

router.put('/:groupId/membership', requireAuth, async (req, res) => {
  const { memberId, status } = req.body;

  const member = await Membership.findOne({
    where: {
      userId: memberId,
      groupId: req.params.groupId
    }
  })

  const user = await User.findByPk(memberId)
  const group = await Group.findByPk(req.params.groupId)
  const ownerCheck = await Membership.findOne({
    where: {
      userId: req.user.id,
      groupId: req.params.groupId,
      status: { [Op.in]: ['host', 'co-host'] }
    }
  })
  if (!group) throw new Error("Group couldn't be found")
  if(!ownerCheck) throw new Error("You are not a owner")
  if(ownerCheck.status === 'co-host' && status === 'co-host') throw new Error("You are not a owner")
  if (status === 'pending') throw new Error("Membership is pending")
  if (!member) throw new Error("Member not found in group")
  if (!user) throw new Error("User couldn't be found")

  member.status = status;

  const response = {}
  response.id = member.id;
  response.groupId = parseInt(req.params.groupId);
  response.memberId = memberId;
  response.status = status;

  member.save();

  return res.json({ response })
})

router.put('/:groupId', requireAuth, async (req, res) => {
  const { name, about, type, private, city, state } = req.body;
  const group = await Group.findByPk(req.params.groupId);
  if (!group) throw new Error("Group couldn't be found")
  if (name.length > 50) throw new Error("Name should be less than 50 characters")
  if (about.length < 20) throw new Error("Should be more than 20 characters")
  if (type !== 'Online' && type !== 'In person') throw new Error("Type must be 'Online' or 'In person'")
  if (typeof private !== 'boolean') throw new Error('ERROR')

  if (req.user.id !== group.organizerId) throw new Error('You must be owner of group')

  if (name) group.name = name;
  if (about) group.about = about;
  if (type) group.type = type;
  if (private) group.private = private;
  if (city) group.city = city;
  if (state) group.state = state;

  group.save();

  return res.json(group)
})

router.delete('/:groupId/membership', requireAuth, async (req, res) => {
  const { memberId } = req.body;

  const group = await Group.findByPk(req.params.groupId)
  if(!group) throw new Error("Group couldn't be found")

  const ownerCheck = await Membership.findOne({
    where: {
      userId: req.user.id,
      groupId: req.params.groupId,
      status: 'host'
    }
  })

  if (req.user.id !== memberId && !ownerCheck) throw new Error('Cannot delete membership')

  const member = await Membership.findOne({
    where: {
      userId: memberId,
      groupId: req.params.groupId
    }
  })
  if(!member) throw new Error("Membership couldn't be found")

  member.destroy();

  return res.json({ message: "Deleted" })
})

router.delete('/:groupId', requireAuth, async (req, res) => {
  const group = await Group.findByPk(req.params.groupId);
  if (!group) throw new Error("Group couldn't be found")
  if (req.user.id !== group.organizerId) throw new Error('You must be owner of group')

  group.destroy();

  return res.json({ message: "Deleted" })
})

module.exports = router;
