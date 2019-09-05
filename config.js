module.exports = {
  MONGODB_INSTANCE: process.env.MONGODB || 'mongodb://localhost:27017/CD_Biblioteca',
  EXTERNAL_PORT: process.env.BOOKSPORT || 3003,
  SECRET_TOKEN: 'miclavedetokens'
}
