const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

// ---------------- LOGGER ----------------
app.use((req, res, next) => {
  console.log("--------------------------------------------------");
  console.log("New Request Received:");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Time:", new Date().toISOString());
  console.log("--------------------------------------------------");
  next();
});

// ------------- STATIC FRONTEND ---------------
app.use(express.static(path.join(__dirname, "../public")));
// serves ../public/app.html → http://localhost:3000/app.html

// ------------- JSON PARSER -------------
app.use(express.json());

// ------------- MONGODB CONNECTION (NO USEUNIFIEDTOPOLOGY WARNING) -------------
let db;

MongoClient.connect("mongodb+srv://ruksanaakhterishere_123:ruksana123@cluster0.1jplbwe.mongodb.net/")
  .then(client => {
    db = client.db("webstore");
    console.log("MongoDB Connected Successfully!");
  })
  .catch(err => console.log("MongoDB Connection Error:", err));

// ------------- BASE ROUTE -------------
app.get("/", (req, res) => {
  res.send("Backend is running. Go to /app.html");
});

// ------------- COLLECTION HANDLER -------------
app.param("collectionName", (req, res, next, name) => {
  req.collection = db.collection(name);
  next();
});

// GET ALL DOCUMENTS
app.get("/collection/:collectionName", (req, res, next) => {
  req.collection
    .find({})
    .toArray()
    .then(results => res.json(results))
    .catch(err => next(err));
});

// GET SINGLE DOCUMENT
app.get("/collection/:collectionName/:id", (req, res, next) => {
  req.collection
    .findOne({ _id: new ObjectId(req.params.id) })
    .then(result => res.json(result))
    .catch(err => next(err));
});

// INSERT DOCUMENT


// UPDATE DOCUMENT
app.put("/collection/:collectionName/:id", (req, res, next) => {
  req.collection
    .updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    )
    .then(result =>
      res.json(
        result.modifiedCount === 1 ? { msg: "success" } : { msg: "error" }
      )
    )
    .catch(err => next(err));
});

// DELETE DOCUMENT


// -------------------- BACKEND SEARCH --------------------


// ----------- PLACE ORDER -----------
app.post("/placeorder", (req, res) => {
  const { name, number, cart } = req.body;

  if (!name || !number || !cart || cart.length === 0) {
    return res.status(400).json({ msg: "Invalid order data" });
  }

  db.collection("orders")
    .insertOne({
      name,
      number,
      cart,
      createdAt: new Date()
    })
    .then(result => {
      res.json({
        msg: "Order placed successfully",
        orderId: result.insertedId
      });
    })
    .catch(err => {
      console.log("Order Save Error:", err);
      res.status(500).json({ msg: "Error placing order" });
    });
});

// ----------- UPDATE SPACES AFTER ORDER -----------
app.put("/update-spaces", async (req, res) => {
  const cart = req.body.cart;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ msg: "Cart is empty" });
  }

  try {
    for (let item of cart) {
      await db.collection("products").updateOne(
        { _id: new ObjectId(item._id) },
        { $inc: { spaces: -1 } }
      );
    }

    res.json({ msg: "Spaces updated successfully" });
  } catch (err) {
    console.log("Update Spaces Error:", err);
    res.status(500).json({ msg: "Failed to update spaces" });
  }
});

// ----------------- START SERVER -----------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("Go to: http://localhost:3000/app.html");
});
