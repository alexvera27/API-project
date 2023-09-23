const express = require('express');
const { Op } = require('sequelize')
const { Event, Venue, Group, Membership, GroupImage, EventImage, Attendance, User } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

const router = express.Router();

router.get('/:eventId/attendees', async (req, res) => {
  const event = await Event.findByPk(req.params.eventId)
  if (!event) throw new Error("Event couldn't be found")
  let membership = await Membership.findOne({
    where: {
      userId: req.user.id,
      groupId: event.groupId,
      status: {[Op.in]: ['host', 'co-host']}
    }
  })
  if (membership) {
    membership = membership.toJSON();
    if ((membership.status === "host" || membership.status === 'co-host')) {
      let attendees = await Attendance.findAll({
        where: {
          eventId: req.params.eventId
        }
      })
      const Attendees = await Promise.all(attendees.map(async person => {
        const user = await User.findByPk(person.userId)
        const data = {};
        data.id = person.id;
        data.firstName = user.firstName;
        data.lastName = user.lastName;
        data.Attendance = { status: person.status }
        return data;
      }))

      return res.json({ Attendees })
    }
  } else {
    const attendees = await Attendance.findAll({
      where: {
        status: { [Op.in]: ['attending', 'waitlist'] },
        eventId: req.params.eventId
      }
    })
    const Attendees = await Promise.all(attendees.map(async person => {
      const user = await User.findByPk(person.userId)
      const data = {};
      data.id = person.id;
      data.firstName = user.firstName;
      data.lastName = user.lastName;
      data.Attendance = { status: person.status }
      return data;
    }))

    return res.json({ Attendees })
  }

})

router.get('/:eventId', async (req, res) => {
  let event = await Event.findOne({
    where: {
      id: req.params.eventId
    },
    attributes: {
      exclude: ['createdAt', 'updatedAt']
    }
  })

  if (!event) throw new Error("Event couldn't be found")

  const place = await Venue.findOne({
    where: {
      id: event.venueId,
    },
    attributes: ['id', 'address', 'city', 'state', 'lat', 'lng']
  })
  const group = await Group.findOne({
    where: {
      id: event.groupId,
    },
    attributes: ['id', 'name', 'city', 'state', 'private']
  })
  if (!group) throw new Error("Group couldn't be found")
  const members = await Membership.findAll({
    where: {
      groupId: group.id
    }
  })
  const image = await EventImage.findAll({
    where: {
      eventId: event.id,
    },
    attributes: ['id', 'url', 'preview']
  })
  event = event.toJSON(),
  event.Venue = place
  event.Group = group
  event.numAttending = members.length
  event.EventImages = image

  return res.json(event)
})

router.get('/', async (req, res) => {
  let { page, size, name, type, startDate } = req.query

  const pagination = {}
  const where = {}
  if (Number(page) < 1) throw new Error("more than or equal to 1")
  if (Number(size) < 1) throw new Error("morethan or equal to 1")
  if (typeof name !== 'string' && name) throw new Error("Name should be string")
  if ((type !== 'Online' && type !== 'In person') && type) throw new Error("Should be 'Online' or 'In person'")
  if (startDate) {
    if ((startDate.parse === NaN) && startDate) throw new Error("Bad start date")
  }

  if (name) {
    where.name = {
        [Op.substring]: name
    }
  }

  if (type) {
    where.type =  type
  }

  if (startDate) {
    where.startDate = {
      [Op.gte]: startDate
    }
  }

  if (size !== '0' && page !== '0') {
    if (!size) size = 50;
    if (!page) page = 1;
    pagination.limit = size,
      pagination.offset = (page - 1) * size
  }


  const events = await Event.findAll({
    where,
    attributes: {
      exclude: ['description', 'price', 'capacity', 'createdAt', 'updatedAt']
    },
    ...pagination,
  })


  let eventArray = await Promise.all(events.map(async event => {
    const place = await Venue.findOne({
      where: {
        id: event.venueId,
      },
      attributes: ['id', 'city', 'state']
    })
    const group = await Group.findOne({
      where: {
        id: event.groupId,
      },
      attributes: ['id', 'name', 'city', 'state']
    })
    if (!group) throw new Error("Group couldn't be found")
    const members = await Membership.findAll({
      where: {
        groupId: group.id
      }
    })
    const image = await EventImage.findOne({
      where: {
        eventId: event.id,
        preview: true
      }
    })
    console.log(image);
    event = event.toJSON(),
    event.Venue = place
    event.Group = group
    event.numAttending = members.length
    event.previewImage = image
    return event
  }))
  console.log(eventArray);
  const Events = eventArray

  res.json({ Events })
})

router.post('/:eventId/attendance', requireAuth, async (req, res) => {
  const event = await Event.findByPk(req.params.eventId)
  if (!event) throw new Error("Event couldn't be found")
  const checkAttendance = await Attendance.findOne({
    where: {
      userId: req.user.id,
      eventId: req.params.eventId
    }
  })
  if (checkAttendance) {
    if (checkAttendance.status === 'pending') throw new Error("Pending approval")
    if (checkAttendance.status) throw new Error("Already registered for event")
  }

  const attendance = await Attendance.create({
    eventId: req.params.eventId,
    userId: req.user.id,
    status: 'pending'
  })
  return res.json({
    userId: attendance.userId,
    status: attendance.status
  })
})

router.post('/:eventId/images', requireAuth, async (req, res) => {
  const { url, preview } = req.body;

  const test = await Event.findByPk(req.params.eventId)
  if (!test) throw new Error("Event couldn't be found")

  const member = await Membership.findAll({
    where: {
      userId: req.user.id,
      status: { [Op.in]: ['co-host', 'host'] }
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
      id: test.groupId
    },
    attributes: ['id']
  });
  const id = groups.map(id => id.get('id'));
  if (!id.length) throw new Error("Event couldn't be found")

  const event = await Event.findOne({
    where: {
      [Op.and]: [
        { id: req.params.eventId },
        { groupId: { [Op.in]: id } }
      ]
    }
  })
  const image = await EventImage.create({
    eventId: event.id,
    url,
    preview

  })

  const response = {
    id: image.id,
    url: image.url,
    preview: image.preview
  }
  return res.json(response)
})

router.put('/:eventId/attendance', requireAuth, async (req, res) => {
  // const currId = req.user.id;
  const { userId, status } = req.body;
  console.log(userId);
  if (status === 'pending') throw new Error('Pending approval')
  const test = await Event.findByPk(req.params.eventId)
  if (!test) throw new Error("Event couldn't be found")

  const attendance = await Attendance.findOne({
    where: {
      userId,
      eventId: req.params.eventId
    }
  })

  const ownerCheck = await Membership.findOne({
    where: {
      groupId: test.groupId,
      userId: req.user.id,
      status: { [Op.in]: ['host', 'co-host']}
    }
  })

  if(!ownerCheck){
    throw new Error("You are not an owner")
  }

  attendance.status = status
  attendance.save();

  return res.json(attendance)
})

router.put('/:eventId', requireAuth, async (req, res) => {
  const { venueId, name, type, capacity, price, description, startDate, endDate } = req.body

  const test = await Event.findByPk(req.params.eventId)
  if (!test) throw new Error("Event couldn't be found")


  if (venueId) {
    const testTwo = await Venue.findByPk(venueId)
    if (!testTwo) throw new Error("Venue couldn't be found")
  }

  const venue = await Venue.findByPk(venueId)
  if (!venue) throw new Error("Venue does not exist")
  if (name.length < 5) throw new Error("Name should be 5 characters or more")
  if (type !== 'Online' && type !== 'In person') throw new Error("Should be 'Online' or 'In person'")
  if (typeof capacity !== 'number') throw new Error('Should be a number')
  if (typeof price !== 'number') throw new Error('Should be a number')
  if (!description) throw new Error("Add a description")
  let date = new Date()
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (parsedStartDate.getTime() <= date.getTime()) throw new Error("Start date must be in the future");
  if (parsedStartDate.getTime() >= parsedEndDate.getTime()) throw new Error("End date is less than start date");


  const member = await Membership.findAll({
    where: {
      userId: req.user.id,
      status: { [Op.in]: ['co-host', 'host'] }
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
      id: test.groupId
    },
    attributes: ['id']
  });
  // console.log(groups);
  const id = groups.map(id => id.get('id'));
  if (!id.length) throw new Error("Bad request")

  const event = await Event.findOne({
    where: {
      [Op.and]: [
        { id: req.params.eventId },
        { groupId: { [Op.in]: id } }
      ]
    },
    attributes: {
      exclude: ['createdAt', 'UpdatedAt']
    }
  })
  if (!event) throw new Error("Event couldn't be found")

  if (venueId) event.venueId = venueId
  if (name) event.name = name
  if (type) event.type = type
  if (capacity) event.capacity = capacity
  if (price) event.price = price
  if (description) event.description = description
  if (startDate) event.startDate = startDate
  if (endDate) event.endDate = endDate

  event.save();

  const response = {
    id: event.id,
    groupId: event.groupId,
    venueId, name,
    type,
    capacity,
    price,
    description,
    startDate,
    endDate
  }

  return res.json(response)
})


router.delete('/:eventId/attendance', requireAuth, async (req, res) => {
  const { userId } = req.body;

  const event = await Event.findByPk(req.params.eventId)
  if (!event) throw new Error("Event couldn't be found")


  const membership = await Membership.findOne({
    where: {
      groupId: event.groupId,
      userId: req.user.id
    }
  })

  if(!membership) throw new Error("Must be owner to delete")


  if (!(membership.status === 'host' || membership.status === 'co-host' || req.user.id === userId)) {
    throw new Error("Must be owner to delete")
  }

  const attendance = await Attendance.findOne({
    where: {
      userId,
      eventId: req.params.eventId
    }
  })
  if (!attendance) throw new Error("ERROR")

  attendance.destroy();

  res.json({
    message: "Deleted"
  })

})

router.delete('/:eventId', requireAuth, async (req, res) => {

  const test = await Event.findByPk(req.params.eventId)
  if(!test)throw new Error("Event couldn't be found")

  const member = await Membership.findAll({
    where: {
      userId: req.user.id,
      status: {[Op.in]: ['co-host', 'host']}
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
      id: req.params.eventId
    },
    attributes: ['id']
  });

  const id = groups.map(id => id.get('id'));
  if (!id.length) throw new Error("Must be owner to delete")


  const event = await Event.findOne({
    where: {
      [Op.and]: [
        { id: req.params.eventId },
        { id: { [Op.in]: id } }
      ]
    },
    attributes: {
      exclude: ['createdAt', 'UpdatedAt']
    }
  })
  event.destroy();

  return res.json({ message: "Successfully deleted" })
})

module.exports = router;
