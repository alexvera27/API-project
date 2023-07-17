'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {

    static associate(models) {
      // define association here
      Attendance.belongsTo(models.User, { foreignKey: 'userId' })
      Attendance.belongsTo(models.Event, { foreignKey: 'eventId' })

    }
  }
  Attendance.init({
    eventId:{
      allowNull: false,
      type: DataTypes.INTEGER
    },
    userId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    status: {
      allowNull: false,
      type:DataTypes.ENUM('pending', 'attending')
    },
  }, {
    sequelize,
    modelName: 'Attendance',
  });
  return Attendance;
};
