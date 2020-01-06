'use strict'

const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const admin = require('../middlewares/admin')

const userController = require('../controllers/userController')

router.post('/', userController.createUser)
router.post('/log', userController.logUser)
router.get('/get/:userId', userController.getUser)
router.get('/', userController.getUserList)
router.put('/:userId', userController.updateUser)
router.delete('/:userId', userController.deleteUser)

router.get('/private', auth, (req, res) => {
  res.status(200).send({ message: 'Tienes acceso' })
})

router.get('/isAdmin', admin, (req, res) => {
  res.status(200).send({ message: 'Tienes acceso' })
})

module.exports = router
