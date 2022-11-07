const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// USERNAME and PASSWORD optional
mongoose.connect("mongodb://<USERNAME>:<PASSWORD>@localhost:27017/<DBNAME>");
// Custom Item Schema
const itemsSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});
const Item = mongoose.model("Item", itemsSchema);
const defaultItems = [];

// Custom List Schema and Modal
const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);
// *----------------- Basic Routes *----------------- //
app.get("/", function (req, res) {
  Item.find({}, (err, results) => {
    if (!err) {
      res.render("main/list", { listTitle: "Today", newListItems: results });
    }
  });
});

app.post("/", function (req, res) {
  // console.log(req.body.listButton); // Return Button Value.
  const returnedButtonValue = req.body.listButton; // Returned Button Value with 'listtitle'
  const wantedToAdd = req.body.newItem; // I want to add this item to database
  if (wantedToAdd == "") {
    res.redirect("/");
  } else {
    const newItem = new Item({ name: wantedToAdd });
    if (returnedButtonValue !== "Today") {
      List.findOne({ name: returnedButtonValue }, (err, result) => {
        if (!err) {
          result.items.push(newItem);
          result.save();
          res.redirect(`/${returnedButtonValue}`);
        }
      });
    } else {
      newItem.save().then(console.log("succesfully added."));
      res.redirect("/");
    }
  }
});
// *----------------- Basic Routes End *----------------- //
// *----------------- Delete Post Method *----------------- //
app.post("/delete", (req, res) => {
  const id = req.body.checkbox;
  //  * ---------- NPUT TYPE=HIDDEN FROM EJS ----------- * //
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(id, (err, result) => {
      if (!err) {
        console.log(`Succesfully deleted ${result.name}`);
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      {
        $pull: {
          items: { _id: id },
        },
      },
      (err, result) => {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});
// *----------------- Delete End *----------------- //

// *----------------- Custom Routes with Express Route *----------------- //
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList && customListName !== "Favicon.ico") {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect(`/${customListName}`);
      } else {
        if (customListName !== "Favicon.ico") {
          // Show existing list
          res.render("main/list", {
            listTitle: foundList.name,
            newListItems: foundList.items,
          });
        }
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started");
});
