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
const bookDB = client.db("test").collection("books");
const authorDB = client.db("test").collection("authors");
const basketDB = client.db("test").collection("baskets");

// const data = JSON.parse(fs.readFileSync('./add.js', 'utf-8'));
// //array
// bookDB.insertMany(data, function(err, res) {
//     if (err) throw err;
//     console.log("Number of documents inserted: " + res.insertedCount);
// });

// const data = JSON.parse(fs.readFileSync('./add.js', 'utf-8'));
// //object
// authorDB.insertOne(data, function(err, res) {
//     if (err) throw err;
//     console.log("The document has been inserted");
// });

// var mySort = { published: -1 };
// var myQuery1 = {publisherID: 3155};
//   bookDB.find().sort(mySort).toArray(function(err, result) {
//     if (err) throw err;
//     console.log(result);
//   });


//once and forever
// bookDB.dropIndexes();
//
// bookDB.createIndex({ name: 'text', author: 'text' }, {default_language: "none", language_override: "none"});

app.post("/search", urlencodedParser, async (req, res) => {
  let authorID = {$exists: true};
  if (req.body.authorID !== undefined) {
    authorID = Number(req.body.authorID);
  }
  // const searchQuery = { $text: { $search: req.body.keyword }};
  const projection = { ISBN: 1, name: 1};
  const loadQuantity = req.body.loadQuantity;

  // bookDB.find(searchQuery).project(projection).toArray(function(err, result) {
  if (req.body.searchParams !== undefined) {
    console.log(req.body.searchParams);
  }
  const searchParams = JSON.parse(JSON.stringify(req.body.searchParams));
  // const deepClone = req.body.searchParams;
  // searchParams["authorID"] = Number(searchParams["author"]);
  // searchParams["publisherID"] = Number(searchParams["publisher"]);
  if (searchParams["author"]) {
      searchParams["authorID"] = searchParams["author"];
      delete searchParams["author"];
  }

  if (searchParams["publisher"]) {
      searchParams["publisherID"] = searchParams["publisher"];
      delete searchParams["publisher"];
  }
  delete searchParams["q"];
  delete searchParams["sort"];

  for (const key in searchParams) {
    const parsed = Number(searchParams[key]);
    if (!isNaN(parsed)) {
      searchParams[key] = parsed;
    }
  }
  const searchQuery = { $text: { $search: req.body.keyword }, ...searchParams };
  console.log(searchQuery);
  bookDB.find(searchQuery).limit(loadQuantity).toArray(function (searchErr, searchResult) {
    if (searchErr) throw searchErr;
    // console.log("searchResult.length: " + searchResult.length);
    res.send({ "result": searchResult });
  });
});

// app.post("/product", urlencodedParser, async (req, res) => {
//   const searchQuery = { ISBN: Number(req.body.id) };
//   let product, author;
//   bookDB.findOne(searchQuery, function (productErr, productResult) {
//     if (productErr) throw productErr;
//     console.log(productResult);
//     if (productResult !== undefined) {
//       authorDB.findOne({authorID: Number(productResult.authorID)}, function (authorErr, authorResult) {
//         if (authorErr) throw authorErr;
//         console.log(authorResult);
//         if (authorResult !== undefined) {
//           bookDB.find({authorID: authorResult.authorID, ISBN: { $ne: Number(req.body.id) }}).toArray(function (sameAuthorErr, sameAuthorResult) {
//             if (sameAuthorErr) throw sameAuthorErr;
//             res.send({ product: productResult, author: authorResult, sameAuthor: sameAuthorResult});
//       });
//     }
//   });}
// });
// });

app.post("/product", urlencodedParser, async (req, res) => {
  const searchQuery = { ISBN: Number(req.body.id) };
  let product, author;
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
    // console.log(randomProductsResult);
    res.send({ randomProducts: randomProductsResult });
  });
});

app.post("/basket-list", urlencodedParser, async (req, res) => {
  function sortByTime(product1, product2) {
    if (product1.time < product2.time) {return 1;}
    if (product1.time > product2.time) {return -1;}
    return 0;
  }

  let userID;
  if (req.body.userID === null) {
    const sessionQuery = { _id: req.signedCookies.server_ssID };
    sessionDB.findOne(sessionQuery, function (sessionErr, sessionRes) {
      if (sessionErr) throw sessionErr;
      if (!sessionRes.basket) {
        // basketDB.insertOne({ userID: Number(req.body.userID), basket: []});
        // res.send({basketListResult: []});
        sessionDB.updateOne({ _id: req.signedCookies.server_ssID }, { $set: { basket: [] } }, { upsert: true });
        res.send({basketListResult: []});
      } else {
        res.send({basketListResult: sessionRes.basket.sort(sortByTime)});
      }
    });
  } else {
    basketDB.findOne({userID: Number(req.body.userID)}, function (basketListErr, basketListResult) {
      var sortBy = { time: 1 };
      if (basketListErr) throw basketListErr;
      if (!basketListResult) {
        basketDB.insertOne({ userID: Number(req.body.userID), basket: []});
        res.send({basketListResult: []});
      } else {
        // if ((req.body.sort === "update")||(req.body.sort === "newload")) {
        //   res.send({basketListResult: basketListResult.basket.sort(sortByTime)});
        // } else {
        //   res.send({basketListResult: basketListResult.basket});
        // }
          res.send({basketListResult: basketListResult.basket.sort(sortByTime)});
      }
    })
}
});

app.post("/basket-items-data", urlencodedParser, async (req, res) => {
  bookDB.find({ISBN : { "$in" : req.body.basketItems}}).toArray(function (basketItemsErr, basketItemsResult) {
    if (basketItemsErr) throw basketItemsErr;
    // console.log(basketItemsResult);
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
  // basketDB.findOne({userID: Number(req.body.userID)}, function (basketListErr, basketListResult) {
  //   if (basketListErr) throw basketListErr;
  //   console.log(basketListResult);
  //   if (Number(req.body.productQuantity) !== 0) {
  //     // if (basketListResult.basket.length === 0) {
  //     //   basketDB.updateOne({ userID: Number(req.body.userID) }, { $push: {basket: {productID: req.body.productID, productQuantity: req.body.productQuantity}}}, {upsert: true});
  //     //   res.send({"result": "pushed 0"});
  //     // } else {
  //     //   basketDB.updateOne({ userID: Number(req.body.userID) }, { $push: {basket: {productID: req.body.productID}}}, {upsert: true});
  //     //   // basketDB.updateOne({ userID: Number(req.body.userID) }, { $push: {basket: {productID: req.body.productID, productQuantity: req.body.productQuantity}}});
  //     //   res.send({"result": "pushed"});
  //     // }
  //
  //      const query = { userID : Number(req.body.userID)};
  //       basketDB.updateOne(query, { $push: {basket: {$each: [{"productID": Number(req.body.productID), "productQuantity": Number(req.body.productQuantity)}]}}}, {upsert: true});
  //       res.send({"result": "setted"});
  //   } else {
  //     basketDB.updateOne({ userID: Number(req.body.userID) }, { $pull: {basket: {productID: req.body.productID}}});
  //     res.send({"result": "pulled"});
  //   }
  // })});

// ------------------------------------------------------------------------------
if (req.body.userID === null) {
  const guestID = req.signedCookies.server_ssID;
  const productID = Number(req.body.productID);
  const productQuantity = Number(req.body.productQuantity);
  const find = await sessionDB.find({_id: guestID, basket: {$elemMatch: {productID: productID}}}).toArray();
  const d = new Date();
  const time = d.getTime();
  let modifiedCount;
  if (productQuantity !== 0) {
    if (find.length === 0) {
      const update = await sessionDB.updateOne({_id: guestID}, { $push: {basket: {$each: [{"productID": productID, "productQuantity": productQuantity, "time": time}]}}}, {upsert: true});
      modifiedCount = update.modifiedCount;
    } else {
      // const removeItem = await basketDB.updateOne({userID: userID}, { $pull: {basket: {productID: productID}}});
      // if (removeItem.modifiedCount !== 0) {
      //   basketDB.updateOne({userID: userID}, { $push: {basket: {$each: [{"productID": productID, "productQuantity": productQuantity}]}}}, {upsert: true});
      // }
      const query = { _id: guestID, "basket.productID": productID };
      const updateDocument = {$set: { "basket.$.productQuantity": productQuantity, "basket.$.time": time }};
      const update = await sessionDB.updateOne(query, updateDocument);
      modifiedCount = update.modifiedCount;
    }
  } else {
    if (find.length !== 0) {
      const update = await sessionDB.updateOne({_id: guestID}, { $pull: {basket: {productID: productID}}});
      modifiedCount = update.modifiedCount;
    }
  }
  if (modifiedCount === 1) {
    res.send({"result": "Updated"});
  } else {
    res.send({"result": "Error"});
  }
} else {
  const userID = Number(req.body.userID);
  const productID = Number(req.body.productID);
  const productQuantity = Number(req.body.productQuantity);
  const find = await basketDB.find({userID: userID, basket: {$elemMatch: {productID: productID}}}).toArray();
  const d = new Date();
  const time = d.getTime();
  let modifiedCount;
  if (productQuantity !== 0) {
    if (find.length === 0) {
      const update = await basketDB.updateOne({userID: userID}, { $push: {basket: {$each: [{"productID": productID, "productQuantity": productQuantity, "time": time}]}}}, {upsert: true});
      modifiedCount = update.modifiedCount;
    } else {
      // const removeItem = await basketDB.updateOne({userID: userID}, { $pull: {basket: {productID: productID}}});
      // if (removeItem.modifiedCount !== 0) {
      //   basketDB.updateOne({userID: userID}, { $push: {basket: {$each: [{"productID": productID, "productQuantity": productQuantity}]}}}, {upsert: true});
      // }
      const query = { userID: userID, "basket.productID": productID };
      const updateDocument = {$set: { "basket.$.productQuantity": productQuantity, "basket.$.time": time }};
      const update = await basketDB.updateOne(query, updateDocument);
      modifiedCount = update.modifiedCount;
    }
  } else {
    if (find.length !== 0) {
      const update = await basketDB.updateOne({userID: userID}, { $pull: {basket: {productID: productID}}});
      modifiedCount = update.modifiedCount;
    }
  }
  if (modifiedCount === 1) {
    res.send({"result": "Updated"});
  } else {
    res.send({"result": "Error"});
  }
}

});

// basketDB.findOne({userID: Number(req.body.userID)}, function (basketListErr, basketListResult) {
//   if (basketListErr) throw basketListErr;
//   console.log(basketListResult);
//   if (Number(req.body.productQuantity) !== 0) {
//     // if (basketListResult.basket.length === 0) {
//     //   basketDB.updateOne({ userID: Number(req.body.userID) }, { $push: {basket: {productID: req.body.productID, productQuantity: req.body.productQuantity}}}, {upsert: true});
//     //   res.send({"result": "pushed 0"});
//     // } else {
//     //   basketDB.updateOne({ userID: Number(req.body.userID) }, { $push: {basket: {productID: req.body.productID}}}, {upsert: true});
//     //   // basketDB.updateOne({ userID: Number(req.body.userID) }, { $push: {basket: {productID: req.body.productID, productQuantity: req.body.productQuantity}}});
//     //   res.send({"result": "pushed"});
//     // }
//
//      const query = { userID : Number(req.body.userID)};
//       basketDB.updateOne(query, { $push: {basket: {$each: [{"productID": Number(req.body.productID), "productQuantity": Number(req.body.productQuantity)}]}}}, {upsert: true});
//       res.send({"result": "setted"});
//   } else {
//     basketDB.updateOne({ userID: Number(req.body.userID) }, { $pull: {basket: {productID: req.body.productID}}});
//     res.send({"result": "pulled"});
//   }
// })});

// ------------------------------------------------------------------------------

  // const query = { userID : req.body.userID, "basket.productID": req.body.productID};
  // let updateDocument;
  // if (req.body.productQuantity === 0) {
  //   updateDocument = {
  //     $pull: { basket: { productID: req.body.productID } }
  //   };
  // } else {
  //   updateDocument = {
  //     $set: { "basket.$.productQuantity": req.body.productQuantity }
  //   };
  // }
  // const result = await basketDB.updateOne(query, updateDocument);
  // res.send({"result": "Updated", "awaitResult" : result});
// });

// app.post("/basket-items-data", urlencodedParser, async (req, res) => {
//   const userQuery = { userID: req.body.userID };
//   userDB.findOne(userQuery, function (err, ress) {
//     if (err) throw err;
//     if (ress !== null) {
//       userDB.updateOne({ userID: req.body.userID },
//         {
//           $set: {
//             basketData: req.body.basketData
//           }
//         }, { upsert: true });
//       res.send({ "result": "BasketData has been updated.", "status": true });
//     } else {
//       res.send({ "result": "Not found.", "status": false });
//     }
//   });
// });

app.post("/g-update-basket", urlencodedParser, async (req, res) => {
  if (req.signedCookies.server_ssID) {
      const sessionQuery = { _id: req.signedCookies.server_ssID };
      sessionDB.updateOne({ sessionQuery }, { $set: { userID: ress.userID } }, { upsert: true });
  }
  const sessionID =req.signedCookies.server_ssID;
  const productID = Number(req.body.productID);
  const productQuantity = Number(req.body.productQuantity);
  const find = await sessionDB.find({_id: sessionID, basket: {$elemMatch: {productID: productID}}}).toArray();
  const d = new Date();
  const time = d.getTime();
  let modifiedCount;
  if (productQuantity !== 0) {
    if (find.length === 0) {
      const update = await basketDB.updateOne({userID: userID}, { $push: {basket: {$each: [{"productID": productID, "productQuantity": productQuantity, "time": time}]}}}, {upsert: true});
      modifiedCount = update.modifiedCount;
    } else {
      // const removeItem = await basketDB.updateOne({userID: userID}, { $pull: {basket: {productID: productID}}});
      // if (removeItem.modifiedCount !== 0) {
      //   basketDB.updateOne({userID: userID}, { $push: {basket: {$each: [{"productID": productID, "productQuantity": productQuantity}]}}}, {upsert: true});
      // }
      const query = { userID: userID, "basket.productID": productID };
      const updateDocument = {$set: { "basket.$.productQuantity": productQuantity, "basket.$.time": time }};
      const update = await basketDB.updateOne(query, updateDocument);
      modifiedCount = update.modifiedCount;
    }
  } else {
    if (find.length !== 0) {
      const update = await basketDB.updateOne({userID: userID}, { $pull: {basket: {productID: productID}}});
      modifiedCount = update.modifiedCount;
    }
  }
  if (modifiedCount === 1) {
    res.send({"result": "Updated"});
  } else {
    res.send({"result": "Error"});
  }
});

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
            res.send({
              // "result": "Hi good old " + sessionRes.session,
              "result": "Old Guest",
              "isLoggedIn": false,
              "userID" : null,
              "basketListResult": sessionRes.basket
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
      "userID" : null,
      "basketListResult": []
     });
  }
});

app.post("/login-old", urlencodedParser, async (req, res) => {
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

app.post("/login", urlencodedParser, async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://vercelreact-taupe.vercel.app');
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
                  responeObject["message"] = "Login successful.";
                  res.send(responeObject);
                }
              });
            }
          });
        // res.send({"result": true, "message": "Login successful."});
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
    subTotal: req.body.subTotal,
    totalPay: req.body.totalPay,
    status: "Delivered"
  };

  // const insertOrder = await orderDB.insertOne(orderQuery, function (orderErr, orderRes) {
  //   if (orderErr) throw orderErr;
  //   return (orderRes.acknowledged).toString();
  // });

  const x = await orderDB.insertOne(orderQuery).then(myRes => {return myRes.acknowledged});
  res.send({"result" : x});

  // const order = req.body.order;
  //
  // for (let i = 0; i < order.length; i++) {
  //   const updateQuantity = await bookDB.updateOne(
  //      { ISBN: order[i].ISBN, $inc: { quantity: -Number(order[i].productQuantity) } }, function (qErr, qRes) {
  //        if (orderErr) throw orderErr;
  //      }
  // );
  // }

  res.send({ "result": insertOrder, "hehe": "hihi" });
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

  // const sessionQuery = { _id: req.signedCookies.server_ssID, userID: req.body.userID };
  // sessionDB.deleteOne(sessionQuery, function (sessionErr, sessionRes) {
  //   if (sessionErr) throw sessionErr;
  //   if (sessionRes !== null) {
  //     console.log(req.body.userID + ' has signed out');
  //     res.send({ "result": "Signed Out", "userID": sessionRes.userID });
  //   } else {
  //     res.send({ "result": "UserID not found" });
  //   }
  // });

  sessionDB.updateOne({ _id: req.signedCookies.server_ssID }, { $unset: {userID: ""} }, { upsert: true });
  console.log(req.body.userID + ' has signed out');
  res.send({ "result": "Signed Out"});

  // console.log(req.body.userID + ' has signed out');
  // req.session.destroy(function(err) {
  //   // cannot access session here
  // })
});