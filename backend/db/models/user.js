'use strict';
const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
      User.hasMany(models.Group, {foreignKey: 'organizerId'})
      User.hasMany(models.Membership, {foreignKey: 'userId'})
      User.hasMany(models.Attendance, {foreignKey: 'userId'})
    }
  }
  User.init({
    firstName: {
      allowNull: false,
      type:DataTypes.STRING
    },
    lastName: {
      allowNull: false,
      type: DataTypes.STRING
    },
    username: {
      allowNull: false,
      type:DataTypes.STRING,
      validate:{
        len: [4, 30],
        isNotEmail(value) {
          if (Validator.isEmail(value)) {
            throw new Error("Username can't be an email");
          }
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate:{
        isEmail: true
      }
    },
    hashedPassword: {
      type:DataTypes.STRING.BINARY,
      validate: {
        len: [60,60]
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    defaultScope: {
      attributes: {
        exclude: ["hashedPassword", "email", "createdAt", "updatedAt"]
      }
    }
  });
  return User;
};
