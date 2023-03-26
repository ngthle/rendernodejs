const express = require("express");
const app = express();
const cors = require('cors');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
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

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://nefyisekki:sPBb2wHhT1zJfoPo@cluster0.3h7zifw.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect((err, database) => {
  if(err) throw err;
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, console.log(`Server started on port ${PORT}`));
});

const userDB = client.db("test").collection("users");
const sessionDB = client.db("test").collection("sessions");
const orderDB = client.db("test").collection("orders");

app.get("/", urlencodedParser, async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://vercelreact-taupe.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  if (req.signedCookies.server_ssID) {
    console.log('Signed Cookies server_ssID: ', req.signedCookies.server_ssID);
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
  } else {
    res.send({ "result": "Nice to meeet you", "isLoggedIn": false });
  }
});

app.post("/login", urlencodedParser, async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://vercelreact-taupe.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  const userQuery = { email: req.body.email };
  userDB.findOne(userQuery, function (err, ress) {
    if (err) throw err;
    if (ress !== null) {
      if (req.body.password === ress.password) {
        sessionDB.updateOne({ _id: req.signedCookies.server_ssID }, { $set: { userID: ress.userID } }, { upsert: true });
        res.send({"result": true, "message": "Login successful."});
      } else {
        res.send({"result": false, "message": "The password you entered is incorrect. Please try again."});
      }
    } else {
      res.send({"result": false, "message": "We couldn't find an account with that email address."});
    }
  });
});

app.post("/check-email", urlencodedParser, async (req, res) => {
  const userQuery = { email: req.body.email };
  userDB.findOne(userQuery, function (err, ress) {
    if (err) throw err;
    if (ress !== null) {
      res.send({ "result": "An account with email " + ress.email + " already exist.", "status": false });
    } else {
      res.send({ "result": "You can use this email.", "status": true });
    }
  });
});

app.post("/check-password", urlencodedParser, async (req, res) => {
  const userQuery = { userID: req.body.userID, password: req.body.password };
  userDB.findOne(userQuery, function (err, ress) {
    if (err) throw err;
    if (ress !== null) {
      res.send({ "result": "Password matched.", "status": true });
    } else {
      res.send({ "result": "The password you entered is incorrect. Please try again.", "status": false });
    }
  });
});

app.post("/change-details", urlencodedParser, async (req, res) => {
  const userQuery = { userID: req.body.userID };
  userDB.findOne(userQuery, function (err, ress) {
    if (err) throw err;
    if (ress !== null) {
      userDB.updateOne({ userID: req.body.userID },
        {
          $set: {
            firstName: req.body.newFirstName,
            lastName: req.body.newLastName,
            phoneNumber: req.body.newPhoneNumber
          }
        }, { upsert: true });
      res.send({ "result": "Details has changed.", "status": true });
    } else {
      res.send({ "result": "Not found.", "status": false });
    }
  });
});

app.post("/change-password", urlencodedParser, async (req, res) => {
  const userQuery = { userID: req.body.userID, password: req.body.password };
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

app.post("/change-email", urlencodedParser, async (req, res) => {
  const userQuery = { userID: req.body.userID };
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

app.post("/registration", urlencodedParser, async (req, res) => {
  const userQuery = {
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
  });
});

app.post("/user/profile", urlencodedParser, async (req, res) => {
  const userQuery = { userID: req.body.userID };
  userDB.findOne(userQuery, function (err, ress) {
    if (err) throw err;
    if (ress !== null) {
      res.send({ "isFound": true, "userID": ress.userID, "firstName": ress.firstName, "lastName": ress.lastName, "email": ress.email });
    } else {
      res.send({ "isFound": false });
    }
  });
});

app.post("/place-order", urlencodedParser, async (req, res) => {
  const orderQuery = {
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
    shopAddress: req.body.shopAddress,
    order: req.body.order,
    totalQuantity: req.body.totalQuantity,
    totalPay: req.body.totalPay,
    status: "Delivered"
  };
  orderDB.insertOne(orderQuery, function (orderErr, orderRes) {
    if (orderErr) throw orderErr;
    res.send({ "result": orderRes.acknowledged });
  });
});

app.post("/get-orders", urlencodedParser, async (req, res) => {
  const orderQuery = {
    userID: req.body.userID
  };
  orderDB.find(orderQuery).toArray(function (orderErr, orderRes) {
    if (orderErr) throw orderErr;
    if (orderRes.length > 0) {
      res.send({ "result": orderRes });
    } else {
      res.send({ "result": "Not found" });
    }
  });
});

app.post("/signout", urlencodedParser, async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://vercelreact-taupe.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  const sessionQuery = { _id: req.signedCookies.server_ssID, userID: req.body.userID };
  sessionDB.deleteOne(sessionQuery, function (sessionErr, sessionRes) {
    if (sessionErr) throw sessionErr;
    if (sessionRes !== null) {
      console.log(req.body.userID + ' has signed out');
      res.send({ "result": "Signed Out", "userID": sessionRes.userID });
    } else {
      res.send({ "result": "UserID not found" });
    }
  });
  client.close();
});
