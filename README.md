# Bibliteca Digital >Core Dumped_
Aplicación de biblioteca de archivos documentales con autenticación de usuarios autorizados

## Descripción del problema
Core Dumped dispone de una carpeta indexada con nginx a la que se accede por autenticación mediante htpasswd. 

En esa carpeta existen, principalmente, archivos PDF y EPUB organizados en carpetas según su temática o tecnología hacia la que están orientados.

El problema es que la única información que se puede ver del libro antes de la descarga es el nombre del archivo. La página generada por nginx no permite búsqueda recursiva ni filtros.

## Solución propuesta
Se quiere desarrollar una webapp en __Node.js__ que muestre todos los libros disponibles, con su miniatura, título, categoría y enlaces de descarga. 
El usuario debería tener la opción de realizar búsquedas dentro de todo el contenido de la biblioteca.
Dentro de un set de de libros, los resultados deberían poder ser filtrables por categoría y etiquetas.

### Definición de Libro
    - title: String
    - author: String
    - category: String
    - synopsis: String
    - publishDate: Date
    - tags: [String]
    - language: String
    - publisher: String
    - pageNumber: Number
    - index: String
    - status: String
    - uploader: User ObjectId
    - format: String
    - size: Number

### Definición de Usuario
	- userName: String
	- firstName: String
	- lastName: String
	- role: String
	- password: String
	- creation: Date
	- donations:
		- money: [Donations ObjectID]
		- books: [Book ObjectID]

### Definición de Donaciones
	- quantity: Number
	- donationDate: Date