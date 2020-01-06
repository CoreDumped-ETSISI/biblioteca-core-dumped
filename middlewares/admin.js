'use strict'

const services = require('../services')

function isAdmin (req, res, next) {
	if(!req.headers.authorization) {
		return res.status(403).send({message: 'No tienes autorización'})
	}

	const token = req.headers.authorization.split(" ")[1]
	services.decodeToken(token)
		.then(response => {
			console.log(response)
            req.user = response.sub
            if(response.role !== "admin")
                return res.status(403).send({message: 'No tienes autorización'})
			next()
		})
		.catch(response => {
			return res.status(403).send({message: 'No tienes autorización'})
		})
}

module.exports = isAdmin