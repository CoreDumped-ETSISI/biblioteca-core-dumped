const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 5000000 }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', ['Content-Type', '*']);
  next();
});

app.use('/user', userRoutes);
app.use('/book', bookRoutes);

module.exports = app;
