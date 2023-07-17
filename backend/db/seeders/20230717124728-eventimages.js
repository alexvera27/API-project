'use strict';
/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA
}

module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = 'EventImages';
    return queryInterface.bulkInsert(options, [
      {
        eventId: 1,
        url: 'https://hips.hearstapps.com/hmg-prod/images/p90445339-lowres-1638019542.jpg?crop=1xw:1xh;center,top&resize=1200:*',
        preview: true
      },
      {
        eventId: 2,
        url: 'https://cdn.jdpower.com/What%20Is%20A%20JDM%20Car.jpg',
        preview: true
      },
      {
        eventId: 3,
        url: 'https://i.pinimg.com/originals/e6/a7/01/e6a70129c091e59a596d6ef1d1e38046.jpg',
        preview: true
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'EventImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
    }, {});
  }
};
