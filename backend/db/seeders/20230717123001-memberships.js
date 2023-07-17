'use strict';
/** @type {import('sequelize-cli').Migration} */
let options = {};

if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = 'Memberships';
    return queryInterface.bulkInsert(options, [
      {
        userId: 1,
        groupId: 1,
        status: 'host'
      },
      {
        userId: 2,
        groupId: 2,
        status: 'host'
      },
      {
        userId: 3,
        groupId: 3,
        status: 'host'
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Memberships';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
    }, {});
  }
};
