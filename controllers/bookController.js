"use strict";

const User = require("../models/user");
const Book = require("../models/book");
const mongoose = require("mongoose");
const enumerated = require("../middlewares/enumStructures");
const epubParser = require('epub-metadata-parser');
const PDFExtract  = require('pdf.js-extract').PDFExtract;
const fsExtra = require('fs-extra');
const crypto = require('crypto');

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
var upload = multer({ storage: storage, preservePath: true }).single('book');


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
        
    else 
      res.status(200).send({book: BookStored})
    /*User.find(
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
    );*/
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

  searchByField('tags', bookTag).then(
    function(result) { 
      res.status(200).send({ result });
    },
    function(error) { res.status(error.status).send(error.message) }
  );
}

function getBookByTitle(req, res) {
  let bookTitle = req.params.title;

  searchByField('title', bookTitle).then(
    function(result) { 
      res.status(200).send({ result });
    },
    function(error) { res.status(error.status).send(error.message) }
  );
}


function getBookByCategory(req, res) {
  let cat = req.params.category;

  searchByField('filename', cat).then(
    function(result) { 
      res.status(200).send({ result });
    },
    function(error) { res.status(error.status).send(error.message) }
  );
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

var searchByField = function(field, fieldValue) {
  return new Promise(function(resolve, reject) {
    Book.find({ [field] : fieldValue })
    .exec((err, books) => {
      if (err)
        reject({ status: 500, message: `Error al realizar la petición: ${err}` });
      if (!books || books.length == 0)
        reject({ status: 404, message: "El Book no existe" });
      resolve(books);
    });
  });
}

var metadata = function(route) {
  return new Promise(function(resolve, reject) {
    const pdfExtract = new PDFExtract();
    const options = {};
    let book = new Book();
    
    pdfExtract.extract(route, options, (err, data) => {
        if (err){
          reject({ status: 404, message: err });
        }
        if(data.meta.info.Author != null) book.author = data.meta.info.Author;
        if(data.meta.info.Title != null) book.title = data.meta.info.Title;
        book.pageNumber = data.pages.length;
        book.status = 'pending';
        book.sha1 = myhash;
        book.filename = req.file.originalname.toLowerCase();

        resolve(book);
    });
  });
}

var saveBook = function(book){
  return new Promise(function(resolve, reject) {
    book.save((err, BookStored) => {
      if (err){
        reject({ status: 500, message: err });
      }
      resolve({ status: 200, message: BookStored });
    });
  });
}

var moveFile = function(origin, destination){
  return new Promise(function(resolve, reject) {
    fsExtra.move(origin, destination)
      .then(() => {
        resolve({ status: 200, message: BookStored });
      })
      .catch(err => {
        reject({ status: 400, message: err });
      })
  });
}

function downloadBook(req,res){
  var file = req.params.file;
  searchByField('filename', file).then(
    function(result) { 
      var fileLocation = './Libros/'+result[0].sha1+'.pdf';
      res.download(fileLocation, result[0].title+'-'+result[0].author+'.pdf'); 
    },
    function(error) { res.status(error.status).send(error.message) }
  );
}

function loadBook(req, res) {
  fsExtra.emptyDirSync('./temp_files');
  upload(req, res, function(err) {
    if (err) {
      return res.status(418).send({})
    }
    var fd = fsExtra.createReadStream('./temp_files/'+req.file.filename);
    var hash = crypto.createHash('sha1');
    var myhash;
    hash.setEncoding('hex');
    
    fd.on('end', function() {
      hash.end();
      myhash =hash.read(); // the desired sha1sum
      console.log("Extracted hash");

      searchByField('sha1', myhash).then(
        function() { 
          metadata('./temp_files/book.pdf').then(
            function(book){
              saveBook(book).then(
                function(){
                  moveFile('./temp_files/book.pdf', `./Libros/${myhash + '.pdf'}`).then(
                    function(end){
                      res.status(end.status).send(end.message)
                    },
                    function(error){
                      res.status(error.status).send(error.message) 
                    }
                  )
                },
                function(error){
                  res.status(error.status).send(error.message) 
                }
              )
            },
            function(error){
              res.status(error.status).send(error.message) 
            }
          )
        },
        function(error) { res.status(error.status).send(error.message) }
      );
    });

    fd.pipe(hash);
  })
}

/*function loadBook(req, res) {
  fsExtra.emptyDirSync('./temp_files');
  upload(req, res, function(err) {
    if (err) {
      return res.status(418).send({})
    }
    var fd = fsExtra.createReadStream('./temp_files/'+req.file.filename);
    var hash = crypto.createHash('sha1');
    var myhash;
    hash.setEncoding('hex');
    
    fd.on('end', function() {
        hash.end();
        myhash =hash.read(); // the desired sha1sum
        console.log("Extracted hash");

        Book.find({ sha1: myhash })
        .exec((err, books) => {
          if (err)
            return res
              .status(500)
              .send({ message: `Error al realizar la petición: ${err}` });
          if (books.length == 0){
            const pdfExtract = new PDFExtract();
            const options = {};
            let book = new Book();
            
            pdfExtract.extract('./temp_files/book.pdf', options, (err, data) => {
                if (err){
                  res.status(404).send({ message: err });
                }
                if(data.meta.info.Author != null) book.author = data.meta.info.Author;
                if(data.meta.info.Title != null) book.title = data.meta.info.Title;
                book.pageNumber = data.pages.length;
                book.status = 'pending';
                book.sha1 = myhash;
                book.filename = req.file.originalname.toLowerCase();

                book.save((err, BookStored) => {
                  if (err){
                    return res
                      .status(500)
                      .send({ message: `Error al crear Book: ${err}` });
                  }
                      
                  else{
                    fsExtra.move('./temp_files/book.pdf', `./Libros/${myhash + '.pdf'}`)//${req.file.originalname.toLowerCase()}`)
                      .then(() => {
                        console.log('success!')
                        res.status(200).send({book: BookStored})
                      })
                      .catch(err => {
                        return res.status(400).send({ message: err});
                      })
                  }
                })
            })
          }
          else
            res.status(400).send({ message: `Already exists` });
        });
    });

    fd.pipe(hash);
  })
}*/

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
  downloadBook
};
