'use strict';
/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up (queryInterface, Sequelize) {
    options.tableName = 'Groups';
    return queryInterface.bulkInsert(options, [
      {
        organizerId: 1,
        name: 'BMW Group',
        about: 'All BMW fans tap in',
        type: 'In person',
        city: 'Jersey City',
        state: 'New Jersey',
        private: false
      },
      {
        organizerId: 2,
        name: 'JDM Group',
        about: 'Fans of JDM cars join us in appreciating brands like Nissan',
        type: 'In person',
        city: 'Bayonne',
        state: 'New Jersey',
        private: false,
      },
      {
        organizerId: 3,
        name: 'Honda Lovers',
        about: 'If you love Hondas, you will love this group',
        type: 'In person',
        city: 'Union City',
        state: 'New Jersey',
        private: true
      }
    ], {});

  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Groups';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
    }, {});
  }
};
