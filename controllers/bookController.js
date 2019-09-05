'use strict'

// const User = require('../models/user')
const Book = require('../models/book')
// const mongoose = require('mongoose')
// const enumerated = require('../middlewares/enumStructures')
const epubParser = require('epub-metadata-parser')
const PDFExtract = require('pdf.js-extract').PDFExtract
const fsExtra = require('fs-extra')
const crypto = require('crypto')
const path = require('path')

var multer = require('multer')

// Will later save in database with more complex name such as file.fieldname + '-' + Date.now()+' '+file.originalname
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp_files')
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.')[1]

    cb(null, file.fieldname + '.' + ext)
  }
})
var upload = multer({ storage: storage, preservePath: true }).single('book')
var upload2 = multer({ storage: storage, preservePath: true }).single('image')

function parseEpub (req, res) {
  epubParser.parse('./temp_files/book.epub', '../Documents', book => {
    if (book === undefined) { res.status(404).send({ message: 'You don´t have any epub files currently' }) } else {
      console.log(book)
      res.status(200).send({ message: book })
    }
  })
}

function parsePDF (req, res) {
  const pdfExtract = new PDFExtract()
  const options = {} /* see below */

  pdfExtract.extract('./temp_files/book.pdf', options, (err, data) => {
    if (err) {
      res.status(404).send({ message: err })
    }
    res.status(200).send({ message: data })
  })
}

function createBook (req, res) {
  const book = new Book()

  book.title = req.body.title
  book.author = req.body.author
  book.category = req.body.category
  book.synopsis = req.body.description
  book.publishDate = req.body.publishDate
  book.tags = req.body.tags
  book.language = req.body.language
  book.publisher = req.body.publisher
  book.pageNumber = req.body.pageNumber
  book.index = req.body.index
  book.uploader = req.body.uploader
  book.status = 'pending'

  console.log(`New book: \n ${book}`)
  book.save((err, bookStored) => {
    if (err) {
      return res
        .status(500)
        .send({ message: `Error al crear Book: ${err}` })
    } else return res.status(200).send({ book: bookStored })
    /*
    User.find(
      { role: enumerated.role[2], role: enumerated.role[3] },
      (err, users) => {
        if (!err && users) {
          users.forEach(u => {
            utils
              .check(u.BooksCollection, BookStored)
              .then(content => {
                u.save((err, uSaved) => {
                  console.log(uSaved);
                });
              });
          });
        }

        res.status(200).send({ message: BookStored });
      }
    );
    */
  })
}

function getAllBooks (req, res) {
  Book.find()
    .exec((err, books) => {
      if (err) {
        return res
          .status(500)
          .send({ message: `Error al realizar la petición: ${err}` })
      }
      if (!books) return res.status(404).send({ message: 'No existen libros' })

      return res.status(200).send({ books })
    })
}

function getBook (req, res) {
  const { bookId } = req.params

  Book.findById(bookId)
    .populate('author')
    .exec((err, book) => {
      if (err) {
        return res
          .status(500)
          .send({ message: `Error al realizar peticion: ${err}` })
      }
      if (!book) return res.status(404).send({ message: 'El libro no existe' })

      return res.status(200).send({ book })
    })
}

function searchAllFields (req, res) {
  const { search } = req.params

  Book.find({
    $or: [{ title: search }, { author: search }, { category: search },
      { synopsis: search }, { tags: search }, { publisher: search }, { index: search }]
  },
  (err, books) => {
    if (err) {
      return res
        .status(500)
        .send({ message: `Error al realizar la petición: ${err}` })
    }
    if (!books) {
      return res
        .status(404)
        .send({ message: 'No existen libros con ese tag' })
    }

    return res.status(200).send({ books })
  })
}

var searchByField = function (field, fieldValue, returnNotFound) {
  return new Promise(function (resolve, reject) {
    Book.find({ [field]: fieldValue })
      .exec((err, books) => {
        if (err) { reject({ status: 500, message: `Error al realizar la petición: ${err}` }) }
        if (!books || books.length === 0) {
          if (returnNotFound) { resolve() }
          reject({ status: 404, message: 'El Book no existe' })
        }
        resolve(books)
      })
  })
}

function getBookByTag (req, res) {
  const { tag } = req.params

  searchByField('tags', tag, false)
    .then((result) => {
      return res.status(200).send({ result })
    })
    .catch((error) => {
      return res.status(error.status).send(error.message)
    })
}

function getBookByTitle (req, res) {
  const { title } = req.params

  searchByField('title', title, false)
    .then((result) => {
      return res.status(200).send({ result })
    })
    .catch((error) => {
      return res.status(error.status).send(error.message)
    })
}

function getBookByCategory (req, res) {
  const { category } = req.params

  searchByField('filename', category, false)
    .then((result) => {
      return res.status(200).send({ result })
    })
    .catch((error) => {
      return res.status(error.status).send(error.message)
    })
}

function updateBook (req, res) {
  const updated = req.body
  const { bookId } = req.params

  Book.findByIdAndUpdate(bookId, updated, (err, oldBook) => {
    if (err) {
      return res
        .status(500)
        .send({ message: `Error al actualizar el libro: ${err}` })
    }
    return res.status(200).send({ oldBook })
  })
}

function deleteBook (req, res) {
  const { bookId } = req.params
  console.log(bookId)
  Book.findByIdAndDelete(bookId, (err, book) => {
    if (err || book === null) {
      return res
        .status(500)
        .send({ message: `Error al borrar el libro: ${err}` })
    }

    var bookPath = path.resolve(__dirname, '../Libros/' + book.sha1 + '.' + book.format)
    var imagePath = path.resolve(__dirname, '../Covers/' + book.sha1 + '.' + book.imageFormat)

    if (fsExtra.existsSync(bookPath)) {
      fsExtra.unlink(bookPath, (err) => {
        if (err) {
          return res
            .status(500)
            .send({ message: `Error al borrar físicamente el libro: ${err}` })
        }
      })
      if (fsExtra.existsSync(imagePath)) {
        fsExtra.unlink(imagePath, (err) => {
          if (err) {
            return res
              .status(500)
              .send({ message: `Error al borrar físicamente la imagen del libro: ${err}` })
          }
          return res.status(200).send({ message: 'La imagen del libro ha sido borrado' })
        })
      }
    } else {
      return res
        .status(500)
        .send({ message: `Error al borrar el libro: ${bookPath}` })
    }
  })
}

var metadata = function (route, myhash, filename) {
  return new Promise(function (resolve, reject) {
    const pdfExtract = new PDFExtract()
    const book = new Book()

    if (filename.includes('.pdf')) {
      pdfExtract.extract(route, {}, (err, data) => {
        if (err) {
          reject({ status: 404, message: err })
        }

        if (data.meta.info.Author != null) book.author = data.meta.info.Author
        if (data.meta.info.Title != null) book.title = data.meta.info.Title
        if (data.meta.info.CreationDate != null) { book.publishDate = parseInt(data.meta.info.CreationDate.match(/\d\d\d\d/), 10) }
        book.pageNumber = data.pages.length
        book.status = 'pending'
        book.sha1 = myhash
        book.filename = filename.toLowerCase()

        resolve(book)
      })
    } else if (filename.includes('.epub')) {
      epubParser.parse(route, '../Documents', bookMeta => {
        if (bookMeta === undefined) {
          reject({ status: 404, message: 'Cannot extract epub metadata' })
        } else {
          if (bookMeta.author != null) book.author = bookMeta.author
          if (bookMeta.title != null) {
            if (bookMeta.title._ != null) { book.title = bookMeta.title._ } else { book.title = bookMeta.title }
          }
          if (bookMeta.description != null) {
            if (bookMeta.description._ != null) { book.synopsis = bookMeta.description._.replace(/<\s*.[^>]*>/g, '') } else { book.synopsis = bookMeta.description.replace(/<\s*.[^>]*>/g, '') }
          }
          if (bookMeta.publisher != null) {
            if (bookMeta.publisher._ != null) { book.publisher = bookMeta.publisher._ } else { book.publisher = bookMeta.publisher }
          }
          if (bookMeta.pubdate) {
            book.publishDate = parseInt(bookMeta.pubdate.match(/[0-9]+/)[0], 10)
            console.log(book.publishDate)
          }
          if (bookMeta.subject != null) {
            if (bookMeta.subject[0] != null) {
              book.category = bookMeta.subject[0]._
            } else {
              book.category = bookMeta.subject[0]
            }
          }
          book.status = 'pending'
          book.sha1 = myhash
          book.filename = filename.toLowerCase()

          resolve(book)
        }
      })
    } else {
      reject({ status: 400, message: 'File extension not suported' })
    }
  })
}

var saveBook = function (book) {
  return new Promise(function (resolve, reject) {
    book.save((err, BookStored) => {
      if (err) {
        reject({ status: 500, message: `Error saving book ${err}` })
      }
      resolve({ status: 200, message: BookStored })
    })
  })
}

var moveFile = function (origin, destination) {
  return new Promise(function (resolve, reject) {
    fsExtra.move(origin, destination)
      .then(() => {
        resolve({ status: 200 })
      })
      .catch(err => {
        reject({ status: 400, message: `Error moving file ${err}` })
      })
  })
}

function downloadBook (req, res) {
  var file = req.params.file
  var extension = file.split('.')[1]
  searchByField('filename', file, false).then(
    function (result) {
      var fileLocation = './Libros/' + result[0].sha1 + '.' + extension
      res.download(fileLocation, result[0].title + '-' + result[0].author + '.' + extension)
    },
    function (error) {
      res.status(error.status).send(error.message)
    }
  )
}

function getMetadata (req, res) {
  fsExtra.emptyDirSync('./temp_files')
  upload(req, res, function (err) {
    if (err) {
      return res.status(418).send({ error: err })
    }
    var extension = req.file.originalname.includes('.pdf') ? '.pdf' : '.epub'
    var route = './temp_files/book' + extension

    metadata(route, 'x', req.file.originalname).then(
      function (book) {
        res.status(200).send(book)
      },
      function (error) {
        res.status(error.status).send(error.message)
      })
  })
}

function loadBook (req, res) {
  const book = new Book()

  book.status = 'pending'

  fsExtra.emptyDirSync('./temp_files')
  console.log('Hello ' + 1)
  upload(req, res, function (err) {
    console.log('Hello ' + 2)
    if (err) {
      console.log('Hello ' + 3)
      return res.status(500).send({ error: err })
    }
    console.log('Hello ' + 4)
    const data = JSON.parse(req.body.data)

    book.title = data.title
    book.author = data.author
    book.category = data.category
    book.synopsis = data.synopsis
    book.publishDate = data.publishDate
    book.publisher = data.publisher
    book.pageNumber = data.pageNumber
    book.size = data.size
    book.imageFormat = data.imageFormat

    var acceptedFormats = ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi']

    if (!acceptedFormats.includes(book.imageFormat.toLowerCase())) {
      res.status(400).send('Wrong image format')
    }

    var fd = fsExtra.createReadStream('./temp_files/' + req.file.filename)
    var hash = crypto.createHash('sha1')
    var myhash
    hash.setEncoding('hex')

    fd.on('end', function () {
      hash.end()
      myhash = hash.read() // the desired sha1sum
      console.log('Extracted hash')

      var extension = req.file.originalname.includes('.pdf') ? '.pdf' : '.epub'
      book.format = extension.replace('.', '')
      var route = './temp_files/book' + extension

      searchByField('sha1', myhash, true).then(
        function () {
          book.sha1 = myhash
          book.filename = req.file.originalname
          saveBook(book).then(
            function (BookStored) {
              moveFile(route, `./Libros/${myhash + extension}`).then(
                function (end) {
                  res.status(end.status).send(BookStored)
                },
                function (error) {
                  res.status(error.status).send(error.message)
                })
            },
            function (error) {
              res.status(error.status).send(error.message)
            }
          )
        },
        function (error) {
          res.status(error.status).send(error.message)
        }
      )
    })
    fd.pipe(hash)
  })
}

function loadImage (req, res) {
  fsExtra.emptyDirSync('./temp_files')
  upload2(req, res, function (err) {
    if (err) {
      return res.status(418).send({ error: err })
    }
    const data = JSON.parse(req.body.data)
    const sha1 = data.sha1

    var route = req.file.destination + '/' + req.file.filename
    var extension = '.' + req.file.filename.split('.')[1]

    moveFile(route, `./Covers/${sha1 + extension}`).then(
      function (end) {
        res.status(end.status).send({ message: 'Everything went ok' })
      },
      function (error) {
        res.status(error.status).send(error.message)
      })
  })
}

module.exports = {
  createBook,
  getBook,
  updateBook,
  deleteBook,
  getAllBooks,
  getBookByTag,
  getBookByTitle,
  getBookByCategory,
  searchAllFields,
  loadBook,
  parseEpub,
  parsePDF,
  downloadBook,
  getMetadata,
  loadImage
}
