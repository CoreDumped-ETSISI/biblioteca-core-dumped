'use strict'

const User = require('../models/user')
// const mongoose = require('mongoose')
// const bcrypt = require('bcrypt-nodejs')
// const enume = require('../middlewares/enumStructures')
const service = require('../services')

function logUser (req, res) {
  const logUser = new User(req.body)

  User.findOne({ userName: logUser.userName })
    .select('+password ')
    .exec((err, user) => {
      if (err) return res.status(500).send({ message: `Error al realizar la petición: ${err}` })
      if (!user) return res.status(404).send({ message: 'El usuario no existe' })

      return user.comparePassword(logUser.password, (err, isMatch) => {
        if (err) return res.status(500).send({ message: `Error al ingresar: ${err}` })
        if (!isMatch) return res.status(404).send({ message: 'Usuario o contraseña incorrectos' })
        return res.status(200).send({ token: service.createToken(user) })
      })
    })
}

function createUser (req, res) {
  const { userName } = req.body
  const { firstName } = req.body
  const { lastName } = req.body
  const { password } = req.body

  if (!userName || !firstName || !lastName || !password) {
    return res.status(400).send({ message: 'missing params' })
  }

  const user = new User({ userName, firstName, lastName, password})
  user.save((err, userStored) => {
    if (err) return res.status(500).send({ message: `Error al salvar la base de datos ${err}` })
    return res.status(200).send({ token: service.createToken(user) })
  })
}

function getUserList (req, res) {
  User.find({}, (err, users) => {
    if (err) return res.status(500).send({ message: `Error al realizar la petición: ${err}` })
    if (users.length === 0) return res.status(404).send({ message: 'No existen usuarios' })
    return res.status(200).send(users)
  })
}

function getUser (req, res) {
  const { userId } = req.params

  User.findById(userId, (err, user) => {
    if (err) return res.status(500).send({ message: `Error al realizar peticion: ${err}` })
    if (!user) return res.status(404).send({ message: 'El usuario no existe' })
    return res.status(200).send({ user })
  })
}

function updateUser (req, res) {
  const updated = req.body
  const { userId } = req.params

  User.findByIdAndUpdate(userId, updated, (err, oldUser) => {
    if (err) return res.status(500).send({ message: `Error al actualizar usuario: ${err}` })
    return res.status(200).send({ oldUser })
  })
}

function deleteUser (req, res) {
  const { userId } = req.params

  User.findByIdAndDelete(userId, (err, user) => {
    if (err) return res.status(500).send({ message: `Error al borrar usuario: ${err}` })
    if (!user) return res.status(404).send({ message: 'El usuario no existe' })
    return res.status(200).send({ message: 'El usuario ha sido borrado' })
  })
}

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getUserList,
  logUser
}
