'use strict'

const express = require('express')
const router = express.Router()

const userController = require('../controllers/userController')

router.post('/', userController.createUser)
router.post('/log', userController.logUser)
router.get('/:userId', userController.getUser)
router.get('/', userController.getUserList)
router.put('/:userId', userController.updateUser)
router.delete('/:userId', userController.deleteUser)

module.exports = router
