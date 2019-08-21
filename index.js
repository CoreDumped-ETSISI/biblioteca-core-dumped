const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');

const config = require('./config');

const port = '3003';
let server;
app.set('port', port);

mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true);

function onError() {
  console.log(`Error connecting DB: ${server.err}`);
}

function listening() {
  console.log('Connected!');
}

mongoose.connect(config.MONGODB_INSTANCE, { useNewUrlParser: true }).then(
  () => {
    server = http.createServer(app);
    server.listen(port);
    server.on('error', onError);
    server.on('listening', listening);
  },
  (err) => {
    console.error(`ERROR: connecting to Database. ${err}`);
  },
);
