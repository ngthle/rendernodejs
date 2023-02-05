const express = require("express");
const cors = require('cors');
const https = require('https');
const fs = require('fs');

const app = require("https-localhost")();
// const app = express();



var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const session = require('express-session');
const MongoStore = require('connect-mongo');


// app.use(cookieParser("keyboard cat"));

// let key = fs.readFileSync('./tutorial.key','utf-8');
// let cert = fs.readFileSync('/tutorial.crt','utf-8');
//
// const parameters = {
//   key: key,
//   cert: cert
// }

// let server = https.createServer(parameters, app);

const PORT = process.env.PORT || 8080;

app.listen(PORT, console.log(`Server started on port ${PORT}`));

app.use(function(req, res, next) {
  res.header('Access-Control-Expose-Headers', 'ETag');
  res.header('Access-Control-Allow-Origin', 'https://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
  app.options('/', (req, res) => {
        // allowed XHR methods
        res.header('Access-Control-Allow-Origin', 'https://localhost:3000');
        res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
        res.send();
  });
});

app.use(cors({
  origin: 'https://localhost:3000',
  methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
  credentials: true
}));

app.use(cookieParser("keyboard cat"));
app.set('trust proxy', 1);

app.use(require("body-parser").json());

// app.get('/', function (req, res) {
//   // Cookies that have not been signed
//   //console.log('Cookies: ', req.cookies)
//
//   // Cookies that have been signed
//   console.log('Signed Cookies server_ssID: ', req.signedCookies.server_ssID)
// })

app.get("/", urlencodedParser, async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

  console.log('Signed Cookies server_ssID: ', req.signedCookies.server_ssID);
  if(req.signedCookies.server_ssID) {

  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
  const collection = client.db("test").collection("sessions");
  // perform actions on the collection object
  var myQuery = { _id: req.signedCookies.server_ssID};

  collection.findOne(myQuery, function(err, ress) {
    if (err) throw err;
    if (ress !== null) {
      res.send({"result": "Hi " + ress.session, "isLoggedIn" : true});
      console.log("isLoggedIn: true");
    } else {
      res.send({"result": "You are not logged in", "isLoggedIn" : false});
    }
  client.close();
  });
  });
} else {
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
    domain : "https://localhost:3000/",
    store: MongoStore.create({
      mongoUrl: "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority",
      collectionName: "sessions" // See below for details
    })
  }));
  res.send({"result": "Hello world", "isLoggedIn" : false});
}});

app.post("/post", urlencodedParser, async (req, res) => {

  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  var myQuery = { email: req.body.email,
                  password: req.body.password};

  collection.findOne(myQuery, function(err, ress) {
    if (err) throw err;
    // console.log("1 document found");
    if (ress !== null) {
      app.use(session({
        name: 'login_ssID',
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        withCredentials: true,
        cookie: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 },
        domain : "https://localhost:3000/",
        store: MongoStore.create({
          mongoUrl: "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority",
          collectionName: "sessions" // See below for details
        })
      }));
      res.send({"result": "Hi " + ress.email, "isLoggedIn" : true});

    } else {
      res.send({"result": "We couldn't find an account with that email address", "isLoggedIn" : false});
    }
  client.close();
  });
  });
});
