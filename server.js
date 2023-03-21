const express = require("express");
const app = express();
const cors = require('cors');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
let sessionID;
let userIDServer;

const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(function (req, res, next) {
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
  saveUninitialized: false,
  withCredentials: true,
  cookie: {
    sameSite: 'none',
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  },
  domain: "https://vercelreact-taupe.vercel.app",
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

  if (req.signedCookies.server_ssID) {
    sessionID = req.signedCookies.server_ssID;
    const { MongoClient, ServerApiVersion } = require('mongodb');
    const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    client.connect(err => {
      const sessionDB = client.db("test").collection("sessions");
      const userDB = client.db("test").collection("users");
      const sessionQuery = { _id: req.signedCookies.server_ssID };

      sessionDB.findOne(sessionQuery, function (sessionErr, sessionRes) {
        if (sessionErr) throw sessionErr;
        if (sessionRes !== null) {
          if (sessionRes.userID) {
            userIDServer = sessionRes.userID;
            userDB.findOne({ userID: userIDServer }, function (userErr, userRes) {
              if (userErr) throw userErr;
              console.log(sessionRes.userID + " has logged in");
              res.send({
                "result": "Hi " + userRes.firstName + userRes.lastName,
                "isLoggedIn": true,
                "userID" : userRes.userID,
                "firstName": userRes.firstName,
                "lastName": userRes.lastName,
                "email": userRes.email,
                "phoneNumber": userRes.phoneNumber
              });
            });
          } else {
            res.send({ "result": "Hi good old " + sessionRes.session, "isLoggedIn": false });
          }
        } else {
          res.send({ "result": "Your session has ended", "isLoggedIn": false });
        }
      });
    });
    client.close();
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
        maxAge: 1000 * 60 * 60 * 24
      },
      domain: "https://vercelreact-taupe.vercel.app",
      store: MongoStore.create({
        mongoUrl: "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority",
        collectionName: "sessions"
      })
    }));
    res.send({ "result": "Nice to meeet you", "isLoggedIn": false });
  }
});

app.post("/login", urlencodedParser, async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
    const userDB = client.db("test").collection("users");
    const sessionDB = client.db("test").collection("sessions");

    var userQuery = { email: req.body.email, password: req.body.password };

    userDB.findOne(userQuery, function (err, ress) {
      if (err) throw err;
      if (ress !== null) {
        sessionDB.updateOne({ _id: sessionID }, { $set: { userID: ress.userID } }, { upsert: true });
        res.send({ "result": "Logged in: " + ress.userID, "isLoggedIn": true });
      } else {
        res.send({ "result": "We couldn't find an account with that email address", "isLoggedIn": false });
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
    const userDB = client.db("test").collection("users");
    var userQuery = { email: req.body.email };

    userDB.findOne(userQuery, function (err, ress) {
      if (err) throw err;
      if (ress !== null) {
        res.send({ "result": "An account with email " + ress.email + " already exist.", "status": false });
      } else {
        res.send({ "result": "You can use this email.", "status": true });
      }
      client.close();
    });
  });
});

app.post("/check-password", urlencodedParser, async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
    const userDB = client.db("test").collection("users");
    var userQuery = { userID: req.body.userID, password: req.body.password };

    userDB.findOne(userQuery, function (err, ress) {
      if (err) throw err;
      if (ress !== null) {
        res.send({ "result": "Password matched.", "status": true });
      } else {
        res.send({ "result": "The password you entered is incorrect. Please try again.", "status": false });
      }
      client.close();
    });
  });
});

app.post("/change-details", urlencodedParser, async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
    const userDB = client.db("test").collection("users");
    var userQuery = { userID: req.body.userID};

    userDB.findOne(userQuery, function (err, ress) {
      if (err) throw err;
      if (ress !== null) {
        userDB.updateOne({ userID: req.body.userID },
        { $set: {
          firstName: req.body.newFirstName,
          lastName: req.body.newLastName,
          phoneNumber: req.body.newPhoneNumber
        } }, { upsert: true });
        res.send({ "result": "Details has changed.", "status": true });
      } else {
        res.send({ "result": "Not found.", "status": false });
      }
    });
  });
  client.close();
});

app.post("/change-password", urlencodedParser, async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
    const userDB = client.db("test").collection("users");
    var userQuery = { userID: req.body.userID, password: req.body.password };

    userDB.findOne(userQuery, function (err, ress) {
      if (err) throw err;
      if (ress !== null) {
        userDB.updateOne({ userID: req.body.userID }, { $set: { password: req.body.newPassword } }, { upsert: true });
        res.send({ "result": "Password has changed.", "status": true });
      } else {
        res.send({ "result": "Not found.", "status": false });
      }
    });
  });
  client.close();
  // important
});

app.post("/change-email", urlencodedParser, async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
    const userDB = client.db("test").collection("users");
    var userQuery = { userID: req.body.userID };

    userDB.findOne(userQuery, function (err, ress) {
      if (err) throw err;
      if (ress !== null) {
        userDB.updateOne({ userID: req.body.userID }, { $set: { email: req.body.newEmail } }, { upsert: true });
        res.send({ "result": "Email has changed.", "status": true });
      } else {
        res.send({ "result": "Not found.", "status": false });
      }
    });
  });
  client.close();
});

app.post("/registration", urlencodedParser, async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
    const userDB = client.db("test").collection("users");
    var userQuery = {
      createdTime: req.body.createdTime,
      userID: req.body.userID,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password
    };

    userDB.insertOne(userQuery, function (err, ress) {
      if (err) throw err;
      res.send({ "result": ress.acknowledged });
      client.close();
    });
  });
});

app.post("/user/profile", urlencodedParser, async (req, res) => {

  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
    const userDB = client.db("test").collection("users");
    var userQuery = { userID: req.body.userID };

    userDB.findOne(userQuery, function (err, ress) {
      if (err) throw err;
      if (ress !== null) {
        res.send({ "isFound": true, "userID": ress.userID, "firstName": ress.firstName, "lastName": ress.lastName, "email": ress.email });
      } else {
        res.send({ "isFound": false });
      }
      client.close();
    });
  });
});

app.post("/place-order", urlencodedParser, async (req, res) => {

  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
    const orderDB = client.db("test").collection("orders");
    var orderQuery = {
      userID: req.body.userID,
      time: req.body.time,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      address: req.body.address,
      city: req.body.city,
      county: req.body.county,
      orderType: req.body.orderType,
      deliveryMethod: req.body.deliveryMethod,
      deliveryFee: req.body.deliveryFee,
      collectAddress: req.body.collectAddress,
      order: req.body.order,
      totalQuantity: req.body.totalQuantity,
      totalPay: req.body.totalPay,
      status: "Delivered"
    };

    orderDB.insertOne(orderQuery, function (orderErr, orderRes) {
      if (orderErr) throw orderErr;
      res.send({ "result": orderRes.acknowledged });
      client.close();
    });
  });
});


    // orderDB.find({}, { projection: { _id: 0, userID: req.body.userID, firstName: 1, lastName: 1,  email: 1, address: 1, city: 1, county: 1, orderType: 1, deliveryMethod: 1, deliveryFee: 1, time: 1, order: 1, collectAddress: 1, totalQuantity: 1, totalPay: 1, status: 1 } }).toArray(function(orderErr, orderRes) {
    //   if (orderErr) throw orderErr;
    //   if (orderRes.length > 0) {
    //     res.send({ "result": orderRes});
    //   } else {
    //     res.send({ "result": "Not found" });
    //   }
    //   client.close();
    // });


app.post("/get-orders", urlencodedParser, async (req, res) => {

  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
    const orderDB = client.db("test").collection("orders");
    var orderQuery = {
      userID: req.body.userID
    };
    orderDB.find(orderQuery).toArray(function(orderErr, orderRes) {
      if (orderErr) throw orderErr;
      if (orderRes.length > 0) {
        res.send({ "result": orderRes});
      } else {
        res.send({ "result": "Not found" });
      }
      client.close();
    });
  });
});

app.post("/signout", urlencodedParser, async (req, res) => {

  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  client.connect(err => {
    const sessionDB = client.db("test").collection("sessions");
    var sessionQuery = { _id: sessionID, userID: req.body.userID };

    sessionDB.deleteOne(sessionQuery, function (sessionErr, sessionRes) {
      if (sessionErr) throw sessionErr;
      if (sessionRes !== null) {
        console.log(req.body.userID + 'has signed out');  
        res.send({ "result": "Signed Out", "userID": sessionRes.userID });
      } else {
        res.send({ "result": "UserID not found" });
      }
      client.close();
    });
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));
