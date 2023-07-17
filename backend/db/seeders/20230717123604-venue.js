'use strict';
/** @type {import('sequelize-cli').Migration} */

let options = {};
if(process.env.NODE_ENV === 'production'){
  options.schema = process.env.SCHEMA
}

module.exports = {
  async up (queryInterface, Sequelize) {
    options.tableName = 'Venues';
    return queryInterface.bulkInsert(options, [
      {
        groupId: 1,
        address: '30 Mall Dr W, Jersey City, NJ 07310',
        city: 'Jersey City',
        state: 'New Jersey',
        lat: 40.7178,
        lng: 74.0431
      },
      {
        groupId: 1,
        address: '1 Garfield Ave, Jersey City, NJ 07305',
        city: 'Bayonne',
        state: 'New Jersey',
        lat: 40.6687,
        lng: 74.1143
      },
      {
        groupId: 2,
        address: 'Washington Park',
        city: 'Union City',
        state: 'New Jersey',
        lat: 40.7795,
        lng: 74.0238
      },
    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Venues';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
    }, {});
  }
};
