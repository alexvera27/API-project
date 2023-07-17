'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EventImage extends Model {

    static associate(models) {
      // define association here
      EventImage.belongsTo(models.Event, {foreignKey: 'eventId'})

    }
  }
  EventImage.init({
    eventId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    url: {
      allowNull:false,
      type:DataTypes.STRING
    },
    preview: {
      allowNull: false,
      type:DataTypes.BOOLEAN
    }
  }, {
    sequelize,
    modelName: 'EventImage',
  });
  return EventImage;
};
