'use strict'

const role = [
  'admin',
  'baseUser',
  'collaborator'
]

const formats = [
  'pdf',
  'epub'
]

const bookStatus = [
  'pending',
  'denied',
  'accepted',
  'erased'
]

const userStatus = [
  'unpaid',
  'paid',
  'banned'
]

module.exports = {
  role,
  formats,
  bookStatus,
  userStatus
}
