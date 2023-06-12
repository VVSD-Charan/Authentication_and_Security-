//Importing dotenv to keep secret key safe
require('dotenv').config();
// Importing express , bodyParser , ejs ,mongoose
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
//Importing passport api for sessions
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');

const app = express();


// Routing to public folder which contains static files 
app.use(express.static("public"));
//Setting default view engine to ejs
app.set("view engine", "ejs");
//Using bodyparser to get inputs from forms
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret:"MERN",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());



//Connecting mongoose and mongodb
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("Database has been connected");
}).catch((err) => {
    console.log("Failed to connect to DB");
});


//Creating schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model('User',userSchema);

//Creating mongoose model
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// --------- STARTING SERVER ----------
//Running server
app.listen(3000, (err) => {
    if (err) {
        console.log("Error occured while starting server");
    } else {
        console.log("Server is up and running on port 3000");
    }
});

// --------- HANDLING GET ---------
//Rendering home page
app.get('/', (request, response) => {
    response.render('home');
});
// Rendering login page 
app.get('/login', (request, response) => {
    response.render('login');
});
//Rendering register page
app.get('/register', (request, response) => {
    response.render('register');
});
app.get('/secrets',(request,response)=>{
    User.find({"secret": {$ne : null}}).then((foundUser)=>{
        response.render("secrets",{foundUser});
    }).catch((err)=>{
        console.log(err);
    });
});
app.get('/logout',(request,response)=>{
    request.logout(function(err){
        if(err){
            console.log(err);
            return response.status(500).send('Internal service error');
        }
    });
    response.redirect('/');
});
app.get('/submit',(request,response)=>{
    if(request.isAuthenticated()){
        response.render("submit");
    }else{
        response.render("login");
    }
});


// -------- HANDLING POST REQUESTS-------------- 
//Handling register post request
app.post('/register', (request, response) => {
   User.register({username: request.body.username},request.body.password,(err,user)=>{
      if(err){
        console.log(err);
        response.redirect("/register");
      }else{
        passport.authenticate("local")(request,response,function(){
            response.redirect('/secrets');
        })
      }
   });
});
// Handling login post request 
app.post('/login', (request, response) => {
    const user=new User({
        username:request.body.username,
        password:request.body.password
    });

    request.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(request,response,function(){
                response.redirect('/secrets');
            })
        }
    });
});
app.post('/submit',(request,response)=>{
    const secret=request.body.secret;

    User.findById(request.user.id).then((foundUser)=>{
            if(foundUser){
                foundUser.secret=secret;
                foundUser.save().then(()=>{
                    response.redirect('/secrets');
                })
        }
    }).catch((err)=>{
        console.log(err);
    });
});