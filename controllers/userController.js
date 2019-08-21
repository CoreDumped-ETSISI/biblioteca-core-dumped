/* eslint-disable consistent-return */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const User = require('../models/user');
const enume = require('../middlewares/enumStructures');
const service = require('../services');

function logUser(req, res) {
  const userLogin = new User(req.body);

  User.findOne({ userName: userLogin.userName })
    .select('+password ')
    .exec((err, user) => {
      if (err) {
        return res
          .status(500)
          .send({ message: `Error al realizar la petición: ${err}` });
      }
      if (!user) {
        return res.status(404).send({ message: 'El usuario no existe' });
      }
      return user.comparePassword(userLogin.password, (err2, isMatch) => {
        if (err2) return res.status(500).send({ message: `Error al ingresar: ${err2}` });
        if (!isMatch) {
          return res
            .status(404)
            .send({ message: 'Usuario o contraseña incorrectos' });
        }
        return res.status(200).send({
          message: 'Te has logueado correctamente',
          token: service.createToken(user),
        });
      });
    });
}

function createUser(req, res) {
  let user = new User();
  user.userName = req.body.userName;
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.password = req.body.password;

  user.save((err, userStored) => {
    if (err) res.status(500).send({ message: `Error al guardar la base de datos ${err}` });
    return res.status(200).send({
      message: 'Usuario creado correctamente',
      token: service.createToken(user),
    });
  });
}

function getUserList(req, res) {
  User.find({}, (err, users) => {
    if (err) {
      return res
        .status(500)
        .send({ message: `Error al realizar la petición: ${err}` });
    }
    if (!users) return res.status(404).send({ message: 'No existen usuarios' });

    return res.status(200).send({ users });
  });
}

function getUser(req, res) {
  const { userId } = req.params;

  User.findById(userId, (err, user) => {
    if (err) {
      return res
        .status(500)
        .send({ message: `Error al realizar peticion: ${err}` });
    }
    if (!user) return res.status(404).send({ message: 'El usuario no existe' });
    return res.status(200).send({ user });
  });
}

function updateUser(req, res) {
  const updated = req.body;
  const { userId } = req.params;

  User.findByIdAndUpdate(userId, updated, (err, oldUser) => {
    if (err) {
      return res
        .status(500)
        .send({ message: `Error al actualizar usuario: ${err}` });
    }
    return res.status(200).send({ oldUser });
  });
}

function deleteUser(req, res) {
  const { userId } = req.params;

  User.findById(userId, (err, user) => {
    if (err) {
      return res
        .status(500)
        .send({ message: `Error al borrar usuario: ${err}` });
    }
    if (!user) return res.status(404).send({ message: 'El usuario no existe' });
    user.remove((err2) => {
      if (err2) {
        return res
          .status(500)
          .send({ message: `Error al borrar usuario: ${err2}` });
      }
      return res.status(200).send({ message: 'El usuario ha sido borrado' });
    });
  });
}

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getUserList,
  logUser,
};
