const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const { result } = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/views"));
app.set("view engine", "ejs");
const port = 3000;

const currentDate = date.getDate();

mongoose.connect("mongodb+srv://admin-george:y7TlT.eR@cluster0.jt9lv.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "You need to specify a name first!"]
    }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add new items."
});

const item3 = new Item({
    name: "<-- Click the checkbox to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: {
        type: String,
        required: [true, "You need to specify a name first!"]
    },
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/", (req, res) => {

    Item.find({}, (err, items) => {
        if (err) {
            console.log(err);
        } else {
            if (items.length === 0) {
                Item.insertMany(defaultItems, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Succesfully inserted items to database.");
                    }
                });
                res.redirect("/");
            } else {
                res.render("list", {listTitle: currentDate, newListItems: items});
            }
        }
    });
});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({name: customListName}, (err, foundList) => {
        if (err) {
            console.log(err);
        } else {
            if (!foundList) {
                // Create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // Redirect to existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });

});

app.get("/about", (req, res) => {
    res.render("about");
});

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({name: itemName});

    if (listName === currentDate) {
        newItem.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, foundList) => {
            if (err) {
                console.log(err);
            } else {
                foundList.items.push(newItem);
                foundList.save();
                res.redirect("/" + listName);
            }
        });
    }

});

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === currentDate) {
        Item.findByIdAndRemove(checkedItemId, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Item removed successfully from database");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/" + listName);
            }
        });
    }
});

app.listen(process.env.PORT || port, () => {
    console.log(`App running at localhost:${port}`);
    console.log("Press Ctrl + C to exit.");
});