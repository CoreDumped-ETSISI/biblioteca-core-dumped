'use strict'

const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')

const bookController = require('../controllers/bookController')

router.post('/createBook', bookController.createBook)
router.post('/getMetadata', bookController.getMetadata)
router.post('/uploadBook', bookController.loadBook)
router.post('/uploadImage', bookController.loadImage)
router.get('/getBooks/:bookId', bookController.getAllBooks)
router.get('/getEpubData', bookController.parseEpub)
router.get('/getPDFData', bookController.parsePDF)
router.get('/getAllBooks', auth, bookController.getAllBooks)
router.get('/download/:file(*)', bookController.downloadBook)
router.get('/searchAllFields/:search', bookController.searchAllFields)
router.get('/getBooksByTitle/:title', bookController.getBookByTitle)
router.get('/getBooksByTag/:tag', bookController.getBookByTag)
router.put('/:bookId', bookController.updateBook)
router.delete('/:bookId', bookController.deleteBook)

router.get('/private', auth, (req, res) => {
  res.status(200).send({ message: 'Tienes acceso' })
})

module.exports = router
