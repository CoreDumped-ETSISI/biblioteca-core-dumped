"use strict";

const User = require("../models/user");
const Book = require("../models/book");
const mongoose = require("mongoose");
const enumerated = require("../middlewares/enumStructures");
const epubParser = require('epub-metadata-parser');
const PDFExtract  = require('pdf.js-extract').PDFExtract;
const fsExtra = require('fs-extra')

var multer = require('multer')

// Will later save in database with more complex name such as file.fieldname + '-' + Date.now()+' '+file.originalname
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp_files')
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.')[1];
    cb(null, file.fieldname +'.'+ ext)
  }
})
var upload = multer({ storage: storage }).single('book');


function parseEpub(req, res) {
  epubParser.parse('./temp_files/book.epub', '../Documents' , book => {
      if(book==undefined)
        res.status(404).send({ message:'You don´t have any epub files currently' });
      else
        res.status(200).send({ message: book });
  });
}

function parsePDF(req, res) {
  const pdfExtract = new PDFExtract();
  const options = {}; /* see below */

  pdfExtract.extract('./temp_files/book.pdf', options, (err, data) => {
      if (err){
        res.status(404).send({ message: err });
      }
      res.status(200).send({ message: data });
  });
}

function createBook(req, res) {
  let book = new Book();

  book.title = req.body.title;
  book.author = req.body.author;
  book.category = req.body.category;
  book.synopsis = req.body.description;
  book.publishDate = req.body.publishDate;
  book.tags = req.body.tags;
  book.language = req.body.language;
  book.publisher = req.body.publisher;
  book.pageNumber = req.body.pageNumber;
  book.index = req.body.index;
  book.uploader = req.body.uploader;
  book.status = 'pending';

  console.log(`New book: \n ${book}`);
  book.save((err, BookStored) => {
    if (err)
      return res
        .status(500)
        .send({ message: `Error al crear Book: ${err}` });

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
  });
}


function getAllBooks(req, res) {
  Book.find()
    .exec((err, books) => {
      if (err)
        return res
          .status(500)
          .send({ message: `Error al realizar la petición: ${err}` });
      if (!books)
        return res.status(404).send({ message: "No existen Books" });

      res.status(200).send({ books });
    });
}

function getBook(req, res) {
  let bookId = req.params.bookId;

  Book.findById(bookId)
    .populate("author")
    .exec((err, book) => {
      if (err)
        return res
          .status(500)
          .send({ message: `Error al realizar peticion: ${err}` });
      if (!book)
        return res.status(404).send({ message: `El Book no existe` });
      res.status(200).send({ book });
    });
}

function searchAllFields(req, res){
  let newSearch = req.params.search;

  Book.find({$or: [{ title: newSearch }, { author: newSearch }, { category: newSearch },
    { synopsis: newSearch }, { tags: newSearch }, { publisher: newSearch }, { index: newSearch } ]})
    .exec((err, books) => {
      if (err)
        return res
          .status(500)
          .send({ message: `Error al realizar la petición: ${err}` });
      if (!books)
        return res
          .status(404)
          .send({ message: "No existen Books con ese tag" });

      res.status(200).send({ books });
    });
}

function getBookByTag(req, res) {
  let bookTag = req.params.tag;

  Book.find({ tags : bookTag })
    .exec((err, books) => {
      if (err)
        return res
          .status(500)
          .send({ message: `Error al realizar la petición: ${err}` });
      if (!books)
        return res
          .status(404)
          .send({ message: "No existen Books con ese tag" });

      res.status(200).send({ books });
    });
}

function getBookByTitle(req, res) {
  let bookTitle = req.params.title;

  Book.find({ title: bookTitle })
    .exec((err, books) => {
      if (err)
        return res
          .status(500)
          .send({ message: `Error al realizar la petición: ${err}` });
      if (!books)
        return res
          .status(404)
          .send({ message: "No existen Books con ese tag" });

      res.status(200).send({ books });
      });
}


function getBookByCategory(req, res) {
  let cat = req.params.category;

  Book.find({ category: cat })
    .exec((err, books) => {
      if (err)
        return res
          .status(500)
          .send({ message: `Error al realizar la petición: ${err}` });
      if (!books)
        return res
          .status(404)
          .send({ message: "No existen Books con esa categoría" });

      res.status(200).send({ books });
    });
}

function updateBook(req, res) {
  let updated = req.body;

  let bookId = req.params.bookId;
  Book.findByIdAndUpdate(bookId, updated, (err, oldBook) => {
    if (err)
      return res
        .status(500)
        .send({ message: `Error al actualizar Book: ${err}` });
    if (!oldBook)
      return res.status(404).send({ message: "El Book no existe" });
    res.status(200).send({ oldBook });
  });
}

function deleteBook(req, res) {
  let bookId = req.params.bookId;

  Book.findById(bookId, (err, book) => {
    if (err)
      return res
        .status(500)
        .send({ message: `Error al borrar Book: ${err}` });
    if (!book)
      return res.status(404).send({ message: `El Book no existe` });
    Book.remove(err => {
      if (err)
        return res
          .status(500)
          .send({ message: `Error al borrar Book: ${err}` });
      res.status(200).send({ message: "El Book ha sido borrado" });
    });
  });
}

function loadBook(req, res) {
  fsExtra.emptyDirSync('./temp_files');
  upload(req, res, function(err) {
    if (err) {
      console.log(err)
      return res.status(418).send({})
    }
    console.log(req)
    return res.sendStatus(200)
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
  parsePDF
};