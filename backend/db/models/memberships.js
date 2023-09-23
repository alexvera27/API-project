'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Membership extends Model {

    static associate(models) {
      // define association here
      Membership.belongsTo(models.Group, {foreignKey: 'groupId'})
      Membership.belongsTo(models.User, {foreignKey: 'userId'})
    }
  }
  Membership.init({
    userId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    groupId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    status: DataTypes.ENUM('pending', 'member', 'co-host', 'host')
  }, {
    sequelize,
    modelName: 'Membership',
  });
  return Membership;
};
