'use strict';
const { error } = require('console');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Group extends Model {

    static associate(models) {
      // define association here
      Group.belongsTo(models.User, {foreignKey: 'organizerId'})
      Group.hasMany(models.Membership, {foreignKey: 'groupId'})
      Group.hasMany(models.GroupImage, {foreignKey: 'groupId'})
      Group.hasMany(models.Venue, {foreignKey: 'groupId'})
      Group.hasMany(models.Event, {foreignKey: 'groupId'})
    }
  }
  Group.init({
    organizerId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    about: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    type: {
      allowNull: false,
      type: DataTypes.ENUM('In person')
    },
    private: DataTypes.BOOLEAN,
    city: {
      allowNull: false,
      type:DataTypes.STRING
    },
    state: {
      allowNull: false,
      type:DataTypes.STRING
    },
  }, {
    sequelize,
    modelName: 'Group',
  });
  return Group;
};
