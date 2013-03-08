#Heythere! Appserver



##Install
Steps to make the server running like a horse. Unix Mac Osx Guide.

1. __install node.js__ http://nodejs.org/download/

2. __install couchdb__

3. __install redis__

4. __install dependencies__
clone this repo, cd into the folder, type `$ npm install`

5. __configure__ modify the config/development.js

##Start

```bash
$ node app.js
```
##Models
###Scaffolding
Generate Models easily with the generator.js . This would generate a model named "post" with attributes title, content and author and title would be required field.

```bash
$ node generate.js model post title:required content author
```

Find out more options via 
```bash 
$ node generate.js
```
###Defaults
###Validation
###Views
###Working with Models
####get
####set
####save
##Controllers
###Scaffolding
Generate Controllers easily with the generator.js . This would generate a controller namend "posts" with methods index, edit and delete. Method "edit" will be acessabble via 'POST' and "delete" via 'DELETE'. Routes to those methods will be added automatically.

```bash
$ node generate.js controller posts index edit:post delete:delete
```

Find out more options via 
```bash
$ node generate.js
```
##Views
##Routes
