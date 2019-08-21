const User = require('../models/user');
const Book = require('../models/book');
const mongoose = require('mongoose');
const enumerated = require('../middlewares/enumStructures');
const epubParser = require('epub-metadata-parser');
const { PDFExtract } = require('pdf.js-extract');
const fsExtra = require('fs-extra');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');

// Will later save in database with more complex name such as
// file.fieldname + '-' + Date.now()+' '+file.originalname
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp_files');
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.')[1];
    cb(null, file.fieldname +'.'+ ext);
  },
});

const upload = multer({ storage, preservePath: true }).single('book');


function parseEpub(req, res) {
  epubParser.parse('./temp_files/book.epub', '../Documents', (book) => {
    if (book === undefined) {
      res.status(404).send({ message: 'You don´t have any epub files currently' });
    } else {
      console.log(book);
      res.status(200).send({ message: book });
    }
  });
}

function parsePDF(req, res) {
  const pdfExtract = new PDFExtract();
  const options = {}; /* see below */

  pdfExtract.extract('./temp_files/book.pdf', options, (err, data) => {
    if (err) {
      res.status(404).send({ message: err });
    }
    res.status(200).send({ message: data });
  });
}


function createBook(req, res) {
  const book = new Book();

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
    if (err) {
      return res
        .status(500)
        .send({ message: `Error al crear Book: ${err}` });
    }
    return res.status(200).send({ book: BookStored });
    /*  User.find(
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
  });
}


function getAllBooks(req, res) {
  Book.find()
    .exec((err, books) => {
      if (err) {
        return res
          .status(500)
          .send({ message: `Error al realizar la petición: ${err}` });
      }
      if (!books) {
        return res.status(404).send({ message: 'No existen Books' });
      }
      return res.status(200).send({ books });
    });
}

function getBook(req, res) {
  const { bookId } = req.params;

  Book.findById(bookId)
    .populate('author')
    .exec((err, book) => {
      if (err) {
        return res
          .status(500)
          .send({ message: `Error al realizar peticion: ${err}` });
      }
      if (!book) {
        return res.status(404).send({ message: 'El Book no existe' });
      }
      return res.status(200).send({ book });
    });
}

function searchAllFields(req, res) {
  const newSearch = req.params.search;

  Book.find({
    $or: [{ title: newSearch }, { author: newSearch }, { category: newSearch },
      { synopsis: newSearch }, { tags: newSearch }, { publisher: newSearch }, { index: newSearch }],
  })
    .exec((err, books) => {
      if (err) {
        return res
          .status(500)
          .send({ message: `Error al realizar la petición: ${err}` });
      }
      if (!books) {
        return res
          .status(404)
          .send({ message: 'No existen Books con ese tag' });
      }
      return res.status(200).send({ books });
    });
}

const searchByField = function (field, fieldValue, returnNotFound) {
  return new Promise((resolve, reject) => {
    Book.find({ [field]: fieldValue })
      .exec((err, books) => {
        if (err) {
          reject({ status: 500, message: `Error al realizar la petición: ${err}` });
        }
        if (!books || books.length === 0) {
          if (returnNotFound) reject({ status: 404, message: 'El Book no existe' });
        }
        resolve(books);
      });
  });
};

function getBookByTag(req, res) {
  const bookTag = req.params.tag;

  searchByField('tags', bookTag, false).then(
    (result) => res.status(200).send({ result }),
    (error) => res.status(error.status).send(error.message),
  );
}

function getBookByTitle(req, res) {
  const bookTitle = req.params.title;

  searchByField('title', bookTitle, false).then(
    (result) => res.status(200).send({ result }),
    (error) => res.status(error.status).send(error.message),
  );
}


function getBookByCategory(req, res) {
  const cat = req.params.category;

  searchByField('filename', cat, false).then(
    (result) => res.status(200).send({ result }),
    (error) => res.status(error.status).send(error.message),
  );
}

function updateBook(req, res) {
  const updated = req.body;
  const { bookId } = req.params;

  Book.findByIdAndUpdate(bookId, updated, (err, oldBook) => {
    if (err) {
      return res
        .status(500)
        .send({ message: `Error al actualizar Book: ${err}` });
    }
    if (!oldBook) {
      return res.status(404).send({ message: 'El Book no existe' });
    }
    return res.status(200).send({ oldBook });
  });
}

function deleteBook(req, res) {
  const { bookId } = req.params;

  Book.findById(bookId, (err, book) => {
    if (err) {
      return res
        .status(500)
        .send({ message: `Error al borrar Book: ${err}` });
    }
    if (!book) {
      return res.status(404).send({ message: 'El Book no existe' });
    }

    book.remove((err2) => {
      if (err2) {
        return res
          .status(500)
          .send({ message: `Error al borrar Book: ${err2}` });
      }

      const name = path.resolve(__dirname, `../Libros/${book.sha1}.${book.filename.split('.')[1]}`);

      if (fsExtra.existsSync(name)) {
        fsExtra.unlink(name, (err3) => {
          if (err3) {
            return res
              .status(500)
              .send({ message: `Error al borrar físicamente Book: ${err3}` });
          }
          return res.status(200).send({ message: 'El Book ha sido borrado' });
        });
      } else {
        return res
          .status(500)
          .send({ message: `Error al borrar asdfsadf Book: ${name}` });
      }
    });
  });
}


const metadata = function (route, myhash, filename) {
  return new Promise((resolve, reject) => {
    const pdfExtract = new PDFExtract();
    const options = {};
    const book = new Book();

    if (filename.includes('.pdf')) {
      pdfExtract.extract(route, options, (err, data) => {
        if (err) {
          reject({ status: 404, message: err });
        }
        if (data.meta.info.Author != null) book.author = data.meta.info.Author;
        if (data.meta.info.Title != null) book.title = data.meta.info.Title;
        book.pageNumber = data.pages.length;
        book.status = 'pending';
        book.sha1 = myhash;
        book.filename = filename.toLowerCase();
        resolve(book);
      });
    } else if (filename.includes('.epub')) {
      epubParser.parse(route, '../Documents', (bookMeta) => {
        if (bookMeta === undefined) {
          reject({ status: 404, message: 'Cannot extract epub metadata' });
        } else {
          if (bookMeta.author != null) book.author = bookMeta.author;
          if (bookMeta.title != null) book.title = bookMeta.title;
          book.status = 'pending';
          book.sha1 = myhash;
          book.filename = filename.toLowerCase();

          resolve(book);
        }
      });
    } else {
      reject({ status: 400, message: 'File extension not suported' });
    }
  });
};

const saveBook = function (book) {
  return new Promise((resolve, reject) => {
    book.save((err, BookStored) => {
      if (err) {
        reject({ status: 500, message: `Error saving book ${err}` });
      }
      resolve({ status: 200, message: BookStored });
    });
  });
};

const moveFile = function (origin, destination) {
  return new Promise((resolve, reject) => {
    fsExtra.move(origin, destination)
      .then(() => {
        resolve({ status: 200 });
      })
      .catch((err) => {
        reject({ status: 400, message: `Error moving file ${err}` });
      });
  });
};

function downloadBook(req, res) {
  const { file } = req.params;
  const extension = file.split('.')[1];

  searchByField('filename', file, false).then(
    function (result) {
      const fileLocation = './Libros/'+result[0].sha1+'.'+extension;
      res.download(fileLocation, result[0].title+'-'+result[0].author+'.'+extension);
    },
    function (error) {
      console.log('My bad');
      res.status(error.status).send(error.message);
},
  );
}

function getMetadata(req, res) {
  fsExtra.emptyDirSync('./temp_files');
  upload(req, res, (err) => {
    if (err) {
      return res.status(418).send({ error: err });
    }
    const extension = req.file.originalname.includes('.pdf')? '.pdf' : '.epub';
    const route = `./temp_files/book${extension}`;

    metadata(route, 'x', req.file.originalname).then(
      function (book) {
        res.status(200).send(book);
      },
      function (error) {
        res.status(error.status).send(error.message);
      },
    );
  });
}

function newLoadBook(req, res) {
  let book = new Book();

  book.status = 'pending';

  fsExtra.emptyDirSync('./temp_files');
  upload(req, res, (err) => {
    if (err) {
      return res.status(418).send({ error: err });
    }
    const data = JSON.parse(req.body.data);

    book.title = data.title;
    book.author = data.author;
    book.category = data.category;
    book.synopsis = data.synopsis;
    book.publishDate = data.publishDate;
    book.publisher = data.publisher;
    book.pageNumber = data.pageNumber;
    book.size = data.size;

    const fd = fsExtra.createReadStream(`./temp_files/${req.file.filename}`);
    const hash = crypto.createHash('sha1');
    let myhash;
    hash.setEncoding('hex');

    fd.on('end', function () {
      hash.end();
      myhash = hash.read(); // the desired sha1sum
      console.log('Extracted hash');

      const extension = req.file.originalname.includes('.pdf') ? '.pdf' : '.epub';
      book.format = extension.replace('.', '');
      const route = `./temp_files/book${extension}`;

      searchByField('sha1', myhash, true).then(
        function () {
          book.sha1 = myhash;
          book.filename = req.file.originalname;
          saveBook(book).then(
            function (BookStored) {
              moveFile(route, `./Libros/${myhash + extension}`).then(
                function (end) {
                  res.status(end.status).send(BookStored);
                },
                function (error) {
                  res.status(error.status).send(error.message);
                },
              );
            },
            function (error) {
              res.status(error.status).send(error.message);
            },
          );
        },
        function (error) {
          res.status(error.status).send(error.message);
        },
      );
    });
    fd.pipe(hash);
  });
}

function loadBook(req, res) {
  fsExtra.emptyDirSync('./temp_files');
  upload(req, res, function (err) {
    if (err) {
      return res.status(418).send({ error: err });
    }
    const fd = fsExtra.createReadStream(`./temp_files/${req.file.filename}`);
    const hash = crypto.createHash('sha1');
    let myhash;
    hash.setEncoding('hex');

    fd.on('end', function () {
      hash.end();
      myhash = hash.read(); // the desired sha1sum
      console.log('Extracted hash');

      const extension = req.file.originalname.includes('.pdf') ? '.pdf' : '.epub';
      const route = `./temp_files/book${extension}`;

      searchByField('sha1', myhash, true).then(
        function () {
          metadata(route, myhash, req.file.originalname).then(
            function (book) {
              saveBook(book).then(
                function (BookStored) {
                  moveFile(route, `./Libros/${myhash + extension}`).then(
                    function (end) {
                      res.status(end.status).send(BookStored);
                    },
                    function (error) {
                      res.status(error.status).send(error.message);
                    },
                  );
                },
                function (error) {
                  res.status(error.status).send(error.message);
                },
              );
            },
            function (error) {
              res.status(error.status).send(error.message);
            },
          );
        },
        function (error) { res.status(error.status).send(error.message); },
      );
    });

    fd.pipe(hash);
  });
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
  newLoadBook,
};
