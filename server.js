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

const checkDomain = require('./middleware');
app.use(checkDomain);

app.use(function (req, res, next) {
  res.header('Access-Control-Expose-Headers', 'ETag');
  res.header('Access-Control-Allow-Origin', 'https://waterstones.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
  app.options('/', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://waterstones.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    res.send();
  });
});

app.use(cors({
  origin: ['https://waterstones.vercel.app', 'https://waterstones-git-main-ngthle.vercel.app'],
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
  domain: "https://waterstones.vercel.app",
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
const bookDB = client.db("test").collection("books");
const authorDB = client.db("test").collection("authors");
const basketDB = client.db("test").collection("baskets");
const publisherDB = client.db("test").collection("publishers");

app.post("/search", urlencodedParser, async (req, res) => {
  const loadQuantity = req.body.loadQuantity;
  if (req.body.searchParams !== undefined) {
    console.log(req.body.searchParams);
  }

  // deepClone
  const searchParams = JSON.parse(JSON.stringify(req.body.searchParams));
  console.log("searchParams: " + JSON.stringify(searchParams));
  let searchQuery = { $text: { $search: req.body.keyword } };

  const checkParamValid = (param) => {
    if ((param !== undefined) && (param !== null) && (param !== "")) {
      return true;
    } else {
      return false;
    }
  }

  const filterData = {};

  if (searchParams["author"]) {
    const filterAuthorArr = [];
    const authorArr = searchParams["author"].split(",");
    authorArr.map((id, idx, arr) => {
      filterAuthorArr.push(Number(id));
    });
    if (checkParamValid(req.body.searchParams.author)) {
      searchQuery.authorID = { $in: filterAuthorArr }
    };
    const authorInfo = await authorDB.find({ authorID: { $in: filterAuthorArr } }).toArray();
    if (authorInfo !== null) {
      filterData.author = authorInfo;
    }
  } else {
    filterData.author = [];
  }

  if (searchParams["publisher"]) {
    const filterPublisherArr = []
    searchParams["publisherID"] = searchParams["publisher"];
    const publisherArr = searchParams["publisherID"].split(",");
    publisherArr.map((id, idx, arr) => {
      filterPublisherArr.push(Number(id));
    });
    if (checkParamValid(req.body.searchParams.publisher)) {
      searchQuery.publisherID = { $in: filterPublisherArr }
    };
    const publisherInfo = await publisherDB.find({ publisherID: { $in: filterPublisherArr } }).toArray();
    if (publisherInfo !== null) {
      filterData.publisher = publisherInfo;
    }
  } else {
    filterData.publisher = [];
  }

  const searchQueryForFilter = { $text: { $search: req.body.keyword } };
  const filterProjection = { authorID: 1, publisherID: 1 };
  const resultProjection = { _id: 0 };
  console.log("searchQuery: " + JSON.stringify(searchQuery));

  const getDataSet = await bookDB.find(searchQueryForFilter).project(filterProjection).limit(loadQuantity).toArray();

  const getFilterData = (getDataSet) => {
    const authorSet = new Set();
    const publisherSet = new Set();
    getDataSet.map(item => {
      authorSet.add(Number(item.authorID));
      publisherSet.add(Number(item.publisherID));
    });
    x = Array.from(authorSet);
    y = Array.from(publisherSet);
    return { "authorSet": x, "publisherSet": y };
  }

  const setData = getFilterData(getDataSet);
  const authorSet = setData.authorSet;
  const publisherSet = setData.publisherSet;

  const authorResult = await authorDB.find({ authorID: { $in: authorSet } }).toArray();
  const bookResult = await bookDB.find(searchQuery).project(resultProjection).limit(loadQuantity).toArray();

  res.send({
    "result": bookResult,
    "authorData": authorResult,
    "authorSet": authorSet,
    "publisherSet": publisherSet,
    "filterData": filterData
  });

});

app.post("/author-list", urlencodedParser, async (req, res) => {
   authorDB.find({authorID: {$in: req.body.authorSet} }).toArray(function (authorListErr, authorListResult) {
    if (authorListErr) throw authorListErr;
    res.send({ authorData: authorListResult });
  });
});

app.post("/publisher-list", urlencodedParser, async (req, res) => {
   publisherDB.find({publisherID: {$in: req.body.publisherSet} }).toArray(function (publisherListErr, publisherListResult) {
    if (publisherListErr) throw publisherListErr;
    res.send({ publisherData: publisherListResult });
  });
});

app.post("/product", urlencodedParser, async (req, res) => {
  const searchQuery = { ISBN: Number(req.body.id) };
  bookDB.findOne(searchQuery, function (productErr, productResult) {
    if (productErr) throw productErr;
    if (productResult !== undefined) {
      authorDB.findOne({authorID: Number(productResult.authorID)}, function (authorErr, authorResult) {
        if (authorErr) throw authorErr;
            res.send({ product: productResult, author: authorResult});
      });
    }
  });
});

app.post("/other-works", urlencodedParser, async (req, res) => {
  bookDB.find({ authorID: Number(req.body.authorID), ISBN: { $ne: Number(req.body.ISBN) } }).toArray(function (sameAuthorErr, sameAuthorResult) {
    if (sameAuthorErr) throw sameAuthorErr;
    res.send({ sameAuthor: sameAuthorResult });
  });
});

app.post("/author-info", urlencodedParser, async (req, res) => {
  authorDB.findOne({ authorID: Number(req.body.authorID) }, function (authorInfoErr, authorInfoResult) {
    if (authorInfoErr) throw authorInfoErr;
    res.send({ author: authorInfoResult });
  });
});

app.post("/author-works", urlencodedParser, async (req, res) => {
  bookDB.find({ authorID: Number(req.body.authorID) }).toArray(function (authorWorksErr, authorWorksResult) {
    if (authorWorksErr) throw authorWorksErr;
    res.send({ authorWorks: authorWorksResult });
  });
});

app.post("/random-products", urlencodedParser, async (req, res) => {
  bookDB.aggregate([
    { $match: { authorID: { $ne: Number(req.body.authorID) } } },
    { $sample: { size: 10 } }
  ]).toArray(function (randomProductsErr, randomProductsResult) {
    if (randomProductsErr) throw randomProductsErr;
    res.send({ randomProducts: randomProductsResult });
  });
});

app.post("/basket-list", urlencodedParser, async (req, res) => {
  function sortByTime(product1, product2) {
    if (product1.time < product2.time) { return 1; }
    if (product1.time > product2.time) { return -1; }
    return 0;
  }
  if (req.body.userID === null) {
    const sessionQuery = { _id: req.signedCookies.server_ssID };
    sessionDB.findOne(sessionQuery, function (sessionErr, sessionRes) {
      if (sessionErr) throw sessionErr;
      if (!sessionRes.basket) {
        sessionDB.updateOne({ _id: req.signedCookies.server_ssID }, { $set: { basket: [] } }, { upsert: true });
        res.send({ basketListResult: [], basketItemsResult: [], quantity: 0 });
      } else {
        const items = [];
        let count = 0;
        sessionRes.basket.map((item) => {
          items.push(item.productID);
          count += item.productQuantity;
        });
        bookDB.find({ ISBN: { "$in": items } }).toArray((basketItemsErr, basketItemsRes) => {
          if (basketItemsErr) throw basketItemsErr;
          res.send({ basketListResult: sessionRes.basket.sort(sortByTime), basketItemsResult: basketItemsRes, quantity: count });
        });
      }
    });
  } else {
    basketDB.findOne({ userID: req.body.userID }, (basketListErr, basketListRes) => {
      if (basketListErr) throw basketListErr;
      const items = [];
      let count = 0;
      basketListRes.basket.map((item) => {
        items.push(item.productID);
        count += item.productQuantity;
      });
      bookDB.find({ ISBN: { "$in": items } }).toArray((basketItemsErr, basketItemsRes) => {
        if (basketItemsErr) throw basketItemsRes;
        res.send({ basketListResult: basketListRes.basket.sort(sortByTime), basketItemsResult: basketItemsRes, quantity: count });
      });
    });
  }
});

app.post("/basket-items-data", urlencodedParser, async (req, res) => {
  bookDB.find({ISBN : { "$in" : req.body.basketItems}}).toArray(function (basketItemsErr, basketItemsResult) {
    if (basketItemsErr) throw basketItemsErr;
    res.send({ basketItemsResult: basketItemsResult });
  });
});

app.post("/send-basket", urlencodedParser, async (req, res) => {
  basketDB.findOne({userID: req.body.userID}, function (basketListErr, basketListResult) {
    if (basketListErr) throw basketListErr;
      basketDB.updateOne({ userID: req.body.userID }, { $set: {basket: req.body.basketData} }, { upsert: true });
      res.send({"result": "Updated"});
  })});

app.post("/update-basket", urlencodedParser, async (req, res) => {
  // guest
  if (req.body.userID === null) {
    const guestID = req.signedCookies.server_ssID;
    const productID = Number(req.body.productID);
    const productQuantity = Number(req.body.productQuantity);
    const find = await sessionDB.find({ _id: guestID, basket: { $elemMatch: { productID: productID } } }).toArray();
    const time = (new Date()).getTime();
    let modifiedCount;
    if (productQuantity !== 0) {
      if (find.length === 0) {
        const update = await sessionDB.updateOne({ _id: guestID }, { $push: { basket: { $each: [{ "productID": productID, "productQuantity": productQuantity, "time": time }] } } }, { upsert: true });
        modifiedCount = update.modifiedCount;
      } else {
        const query = { _id: guestID, "basket.productID": productID };
        const updateDocument = { $set: { "basket.$.productQuantity": productQuantity, "basket.$.time": time } };
        const update = await sessionDB.updateOne(query, updateDocument);
        modifiedCount = update.modifiedCount;
      }
    } else {
      if (find.length !== 0) {
        const update = await sessionDB.updateOne({ _id: guestID }, { $pull: { basket: { productID: productID } } });
        modifiedCount = update.modifiedCount;
      }
    }
    if (modifiedCount === 1) {
      res.send({ "result": "Updated" });
    } else {
      res.send({ "result": "Error" });
    }
  } else {
    // user logged in
    const userID = req.body.userID;
    const productID = Number(req.body.productID);
    const productQuantity = Number(req.body.productQuantity);
    const find = await basketDB.find({ userID: userID, basket: { $elemMatch: { productID: productID } } }).toArray();
    const time = (new Date()).getTime();
    let modifiedCount;
    if (productQuantity !== 0) {
      if (find.length === 0) {
        const update = await basketDB.updateOne({ userID: userID }, { $push: { basket: { $each: [{ "productID": productID, "productQuantity": productQuantity, "time": time }] } } }, { upsert: true });
        modifiedCount = update.modifiedCount;
      } else {
        const query = { userID: userID, "basket.productID": productID };
        const updateDocument = { $set: { "basket.$.productQuantity": productQuantity, "basket.$.time": time } };
        const update = await basketDB.updateOne(query, updateDocument);
        modifiedCount = update.modifiedCount;
      }
    } else {
      if (find.length !== 0) {
        const update = await basketDB.updateOne({ userID: userID }, { $pull: { basket: { productID: productID } } });
        modifiedCount = update.modifiedCount;
      }
    }
    if (modifiedCount === 1) {
      res.send({ "result": "Updated" });
    } else {
      res.send({ "result": "Error" });
    }
  }

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
  const dataList = ["firstName", "lastName", "phoneNumber"];
  const dataObj = {};
  for (let key of dataList) {
    if (req.body[key]) {
      dataObj[key] = req.body[key];
    }
  }
  userDB.findOne(userQuery, function (err, ress) {
    if (err) throw err;
    if (ress !== null) {
      userDB.updateOne({ userID: req.body.userID },
        {
          $set: dataObj
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
      userDB.updateOne({ userID: req.body.userID }, { $set: { email: req.body.email } }, { upsert: true });
      res.send({ "result": "Email has changed.", "status": true });
    } else {
      res.send({ "result": "Not found.", "status": false });
    }
  });
});

app.post("/registration", urlencodedParser, async (req, res) => {
  const createdTime = (new Date()).getTime();
  const userID =  createdTime.toString() + (Math.floor(Math.random() * (9999 - 1000)) + 1000).toString();
  const userQuery = {
    createdTime: createdTime,
    userID: userID,
    ...req.body
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
  const createdTime = (new Date()).getTime();
  const orderID =  createdTime.toString() + (Math.floor(Math.random() * (9999 - 1000)) + 1000).toString();
  const orderQuery = {
    orderID: orderID,
    time: createdTime,
    ...req.body,
    status: "Delivered"
  };

  const x = await orderDB.insertOne(orderQuery).then(myRes => {return myRes.acknowledged});

  if ((req.body.userID !== null)&&(x === true)) {
    basketDB.updateOne({ userID: req.body.userID }, { $set: { basket: [] } }, { upsert: true }).then(myRess => {
      console.log(myRess);
      if (myRess.modifiedCount === 1) {
        res.send({"result" : x, "orderID": orderID});
      }
    });
  } else {
    sessionDB.updateOne({ _id: req.signedCookies.server_ssID }, { $set: { basket: [] } }, { upsert: true });
    res.send({ "result": x, "orderID": orderID });
  }
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

app.post("/order-detail", urlencodedParser, async (req, res) => {
  const orderQuery = {
    orderID: req.body.orderID
  };
  orderDB.findOne(orderQuery, function (orderErr, orderRes) {
    if (orderErr) throw orderErr;
    res.send({ "order": orderRes });
  });
});

//--------------------------------------------------

app.get("/", urlencodedParser, async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://waterstones.vercel.app');
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
            res.send({
              // "result": "Hi good old " + sessionRes.session,
              "result": "Old Guest",
              "isLoggedIn": false,
              "userID" : null
            });
          }
        } else {
          res.send({ "result": "Your session has ended", "isLoggedIn": false });
        }
      });
  } else {
    res.send({
      "result": "New Guest",
      "isLoggedIn": false,
      "userID" : null
     });
  }
});

app.post("/login", urlencodedParser, async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://waterstones.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

  const userQuery = { email: req.body.email };
  const sessionQuery = { _id: req.signedCookies.server_ssID };

  userDB.findOne(userQuery, function (err, ress) {
    if (err) throw err;
    if (ress !== null) {
      if (req.body.password === ress.password) {

        const responeObject = {};

          sessionDB.findOne(sessionQuery, function (sessionErr, sessionRes) {
            if (sessionErr) throw sessionErr;
            if ((!sessionRes.basket)||(sessionRes.basket.length === 0)) {
              responeObject["sessionBasketEdit"] = false;
              sessionDB.updateOne({ _id: req.signedCookies.server_ssID }, { $set: { userID: ress.userID } }, { upsert: true }).then(loginRes => {
                if (loginRes.modifiedCount === 1) {
                  responeObject["result"] = true;
                  responeObject["message"] = "Login successful.";
                  res.send(responeObject);
                }
              });
            } else {
              responeObject["sessionBasketEdit"] = true;
              let modifiedCount = 0;
              let l = sessionRes.basket.length;
              sessionRes.basket.map((item, idx, arr) => {
                const d = new Date();
                const time = d.getTime();
                basketDB.updateOne({userID: ress.userID}, { $push: {basket: {$each: [{"productID": item.productID, "productQuantity": item.productQuantity, "time": time}]}}}, {upsert: true});
                modifiedCount ++;
                if (modifiedCount === l) {
                  sessionDB.updateOne(sessionQuery, { $set: { basket: [] } }, { upsert: true });
                }
              });
              sessionDB.updateOne({ _id: req.signedCookies.server_ssID }, { $set: { userID: ress.userID } }, { upsert: true }).then(loginRes => {
                if (loginRes.modifiedCount === 1) {
                  responeObject["result"] = true;
                  responeObject["message"] = "Login successful.";
                  res.send(responeObject);
                }
              });
            }
          });
      } else {
        res.send({"result": false, "message": "The password you entered is incorrect. Please try again."});
      }
    } else {
      res.send({"result": false, "message": "We couldn't find an account with that email address."});
    }
  });
});

app.post("/signout", urlencodedParser, async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://waterstones.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  
  sessionDB.updateOne({ _id: req.signedCookies.server_ssID }, { $unset: {userID: ""} }, { upsert: true });
  console.log(req.body.userID + ' has signed out');
  res.send({ "result": "Signed Out"});
});