'use strict';
/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA
}

module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = 'Events';
    return queryInterface.bulkInsert(options, [
      {
        venueId: 1,
        groupId: 1,
        name: 'BMW Day',
        description: 'Everyone with a BMW pop out',
        type: 'In person',
        capacity: 50,
        price: 10.00,
        startDate: new Date('2023-07-17T09:00:00Z'),
        endDate: new Date('2023-07-17T12:00:00Z'),
      },
      {
        venueId: 1,
        groupId: 2,
        name: 'JDM Day',
        description: 'Anyone who loves JDM cars come hang out',
        type: 'In person',
        capacity: 50,
        price: 10.00,
        startDate: new Date('2023-07-17T09:00:00Z'),
        endDate: new Date('2023-07-17T12:00:00Z'),
      }, {
        venueId: 1,
        groupId: 3,
        name: 'Honda Day',
        description: 'If you love Hondas than you will love this',
        type: 'In person',
        capacity: 50,
        price: 10.00,
        startDate: new Date('2023-07-17T09:00:00Z'),
        endDate: new Date('2023-07-17T12:00:00Z'),
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Events';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
    }, {});
  }
};
