require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-chirag:chirag123@cluster0-cedwv.mongodb.net/todolistUserDB", {useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify: false});
mongoose.set('useCreateIndex', true);



const itemsShcema =  new mongoose.Schema({
  name: String,
  taskType: String,
  taskStatus: String,
  dueDate: Date
});
// itemsSchema.plugin(passportLocalMongoose);
const Item = new mongoose.model("Item",itemsShcema);

const userSchema = new mongoose.Schema ({
   email: String,
   password: String,
   items: [itemsShcema]
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});
// app.get("/secrets",function(req,res){
//   if(req.isAuthenticated()){
//       res.render("list");
//   }else{
//     res.redirect("/login");
//   }
// });
app.get("/list",function(req,res){
  if(req.isAuthenticated()){
  res.render("list",{newListItems: req.user.items,uname: req.user.uname});
  }else{
    res.redirect("/login");
  }
})
app.get("/logout",function(req,res){
  req.logout();
  res.redirect('/');
})
app.get("/about",function(req,res){
  res.render("about")
})
app.get("/contact", function(req, res){
  res.render("contact");
});
app.post("/list",function(req,res){
  const itemName = req.body.newItem;
  const itemType = req.body.selectpicker;
  const item = new Item({
    name: itemName,
    taskType: itemType
  });
  req.user.items.push(item);
  req.user.save();
  res.redirect("/list");
});

 app.post("/register",function(req,res){

   User.register({username: req.body.username},req.body.password,function(err, user){
     if(err){
       console.log(err);
       console.log(err.name);
       res.redirect("/register")
     }else{
       passport.authenticate("local")(req,res,function(){
         res.redirect("/list",)
       })
     }
   });
 });

app.post("/login",function(req,res){
  const user = new User({
    email: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/list")
      });
    }
  })

})

app.post("/delete",function(req,res){
  const delItemId = req.body.deleteButton;
  if(req.isAuthenticated()){
    User.findOneAndUpdate({username: req.user.username},{$pull:{items:{_id: delItemId}}},function(err,foundList){
        if(!err){
          res.redirect("/list");
        }
    })
  }else{
    res.redirect("/");
  }
  // User.findOneAndUpdate({username: req.user.username},{$pull:{items:{_id: delItemId}}},function(err,foundList){
  //     if(!err){
  //       res.redirect("/list");
  //     }else{
  //       res.redirect("/login");
  //     }
  // })
});


app.listen(3000,function(){
  console.log("Server started on PORT 3000");
});
