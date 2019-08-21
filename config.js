module.exports = {
  MONGODB_INSTANCE: process.env.MONGODB || 'mongodb://localhost:27017/coreDumpedFridge',
  EXTERNAL_PORT: process.env.BOOKSPORT || 3003,
  SECRET_TOKEN: 'miclavedetokens',
};
