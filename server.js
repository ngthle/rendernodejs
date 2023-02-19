const express = require("express");
const app = express();
const cors = require('cors');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
let userID;

const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(function(req, res, next) {
  res.header('Access-Control-Expose-Headers', 'ETag');
  res.header('Access-Control-Allow-Origin', 'https://vercelreact-taupe.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
  app.options('/', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://vercelreact-taupe.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    res.send();
  });
});

app.use(cors({
  origin: 'https://vercelreact-taupe.vercel.app',
  methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
  credentials: true
}));

app.use(cookieParser("keyboard cat"));
app.set('trust proxy', 1);

app.use(require("body-parser").json());


app.use(session({
  name: 'server_ssID',
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  withCredentials: true,
  cookie: {
  sameSite: 'none',
  secure: true,
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 },
  domain : "https://vercelreact-taupe.vercel.app",
  store: MongoStore.create({
    mongoUrl: "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority",
    collectionName: "sessions"
  })
}));

app.get("/", urlencodedParser, async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://vercelreact-taupe.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

  console.log('Signed Cookies server_ssID: ', req.signedCookies.server_ssID);
  if(req.signedCookies.server_ssID) {
  userID = req.signedCookies.server_ssID;
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
  const collection = client.db("test").collection("sessions");
  const userDB = client.db("test").collection("devices");
  var myQuery = {_id: req.signedCookies.server_ssID};

  collection.findOne(myQuery, function(err, ress) {
    if (err) throw err;
    if (ress !== null) {
      if (ress.email) {
        userDB.findOne({email: ress.email}, function(userErr, userRes) {
        if (userErr) throw userErr;
        res.send({"result": "Hi my old friend!","isLoggedIn": true, "firstName": userRes.firstName, "lastName": userRes.lastName, "email": userRes.email});});
        console.log(ress.email + " has logged in");
      } else {
        res.send({"result": "Hello my old guest!" + ress.session, "isLoggedIn" : false});
      }
    } else {
      res.send({"result": "Your session has ended", "isLoggedIn" : false});
    }
  client.close();
  });
  });
} else {
  res.send({"result": "Nice to meeet you", "isLoggedIn" : false});
}});

app.post("/login", urlencodedParser, async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
  const collection = client.db("test").collection("devices");
  const sessionsDB = client.db("test").collection("sessions");

  var myQuery = {email: req.body.email, password: req.body.password};

  collection.findOne(myQuery, function(err, ress) {
    if (err) throw err;
    if (ress !== null) {
      res.cookie('userEmail', req.body.email, { sameSite: 'none', secure: true, httpOnly: true, maxAge: 1000 * 60 * 60 * 24, signed: true });
      sessionsDB.updateOne({_id: userID}, {$set: {email: req.body.email}}, {upsert: true});
      res.send({"result": "Logged in: " + ress.email, "isLoggedIn": true});
    } else {
      res.send({"result": "We couldn't find an account with that email address", "isLoggedIn": false});
    }
  });  
  });
  client.close();
});

app.post("/check-email", urlencodedParser, async (req, res) => {

  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  var myQuery = {email: req.body.email};

  collection.findOne(myQuery, function(err, ress) {
    if (err) throw err;
    if (ress !== null) {
      res.send({"result": "An account with email " + ress.email + " already exist.", "status": false});
    } else {
      res.send({"result": "You can use this email.", "status": true});
    }
  client.close();
  });
  });
});

app.post("/registration", urlencodedParser, async (req, res) => {

  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  var myQuery = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password
  };

  collection.insertOne(myQuery, function(err, ress) {
    if (err) throw err;
    res.send({"result": ress.acknowledged});
  client.close();
  });
  });
});

app.post("/user/profile", urlencodedParser, async (req, res) => {

  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
  const collection = client.db("test").collection("devices");
  var myQuery = {email: req.body.email};

  collection.findOne(myQuery, function(err, ress) {
    if (err) throw err;
    if (ress !== null) {
      res.send({"isFound": true, "firstName": ress.firstName, "lastName": ress.lastName, "email": ress.email});
    } else {
      res.send({"isFound": false});
    }
  client.close();
  });
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));
