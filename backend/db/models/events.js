'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {

    static associate(models) {
      // define association here
      Event.belongsTo(models.Group, { foreignKey: 'groupId' })
      Event.belongsTo(models.Venue, { foreignKey: 'venueId' })
      Event.hasMany(models.EventImage, {foreignKey: 'eventId'})
      Event.hasMany(models.Attendance, {foreignKey: 'eventId'})
    }
  }
  Event.init({
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    venueId: {
      type: DataTypes.INTEGER,
    },
    groupId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING,
      validate: {
        isLong(value) {
          if (value.length < 5) throw new Error()
        }
      }
    },
    description: {
      allowNull: false,
      type: DataTypes.STRING
    },
    type: {
      allowNull: false,
      type: DataTypes.ENUM('In person')
    },
    capacity: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    price: {
      allowNull: false,
      type: DataTypes.DECIMAL(99, 2)
    },
    startDate: {
      allowNull: false,
      type: DataTypes.DATE,
      validate: {
        isAfterStartDate(value) {
          const date = new Date()
          const startDate = new Date(value)
          if (date.getTime() >= startDate.getTime()) throw new Error('Start date should be after today');
        },
        isDate: true,
      },
    },
    endDate: {
      allowNull: false,
      type: DataTypes.DATE,
      validate: {
        isAfterStartDate(value) {
          const endDate = new Date(value)
          const startDate = new Date(this.startDate)
          if (endDate.getTime() <= startDate.getTime()) throw new Error('End date should be after start date');
        },
        isDate: true,
      },
    },
  }, {
    sequelize,
    modelName: 'Event',
    primaryKey: 'id'
  });
  return Event;
};
