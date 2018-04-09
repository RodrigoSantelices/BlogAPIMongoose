'use strict';

const express = require('express');
const mongoose = require('mongoose');

mogoose.Promise = global.Promise;

const bodyParser = require('body-parser');

const {PORT, DATABASE_URL} = requrie('./config');
const {BlogPosts} = require('./models')
const app = express();
app.use(bodyParser.json());

// GET request all blogposts
app.get('/blogposts', (req, res) =>{
  BlogPosts
  .find().then(blogposts =>{
    res.json({
      blogposts: blogposts.map(
        (blogpost) => blogpost.serialize())
    });
  })
  .catch(err =>{
    console.log(err);
    res.status(500).json({message: 'Internal server error'});
  });
});

// GET request by id
app.get('/blogposts/:id',(req, res) =>{
  BlogPosts
  .findById(req.params.id)
  .then(blogpost => res.json(blogpost.serialize()))
  .catch(err =>{
    console.log(err);
    res.status(500).json({ message: 'Internal server error'});
  });
});

// POST new blog posts
app.post('/blogposts', (req, res) =>{
  const requiredFields = ['title', 'content', 'author'];
  for (i=0; i < requiredFields.length; i++){
    const field = requiredFields[i];
    if(!(field in req.body)){
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  BlogPosts
  .create({
    title: req.body.title,
    content: req.body.content,
    author: req.body.author,
    created: req.body.created
  })
  .then(blogpost => res.status(201).json(blogpost.serialize()))
  .catch(err =>{
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  });
});

app.put('.blogposts/:id', (req, res) =>{
if(!(req.params.id && req.body.id && req.params.id === req.body.id)){
  const message = (`Request path id (${req.params.id}) and request body id (${req.body.id}) must match`);
  console.error(message);
  return res.status(400).json({message: message});
}
const toUpdate ={};
const updateableFields = ['title','content','author','created'];

updateableFields.forEach(field =>{
  if(field in req.body){
    toUpdate[field] = req.body[field];
  }
});

BlogPosts
.findByIdAndUpdate(req.params.id, {$set: toUpdate})
.then(blogpost => res.status(204).end())
.catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.delete('blogposts/:id', (req, res) =>{
BlogPosts
.findByIdAndRemove(req.params.id)
.then(blogpost => res.status(204).end())
.catch(err => res.status(500).json({message: 'Internal server error'}));

});

// catch-all endpoint if client makes request to non-existent endpoint
app.use('*', function (req, res) {
  res.status(404).json({ message: 'Not Found' });
});

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
