//Importing dotenv to keep secret key safe
require('dotenv').config();
// Importing express , bodyParser , ejs ,mongoose
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');

//Importing bcrypt (better hashing algo)
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();


//Connecting mongoose and mongodb
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("Database has been connected");
}).catch((err) => {
    console.log("Failed to connect to DB");
});
//Creating schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//Creating mongoose model
const User = mongoose.model('User', userSchema);


// Routing to public folder which contains static files 
app.use(express.static("public"));
//Setting default view engine to ejs
app.set("view engine", "ejs");
//Using bodyparser to get inputs from forms
app.use(bodyParser.urlencoded({ extended: true }));


//Running server
app.listen(3000, (err) => {
    if (err) {
        console.log("Error occured while starting server");
    } else {
        console.log("Server is up and running on port 3000");
    }
});


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


//Handling register post request
app.post('/register', (request, response) => {
    var username = request.body.username;

    //Using bcrypt to hash
    bcrypt.hash(request.body.password, saltRounds, (err, hash) => {
        if (err) {
            console.log("Error while hashing");
            response.redirect('/register');
        } else {
            var userpassword = hash;

            const newUser = new User({
                email: username,
                password: userpassword
            });

            newUser.save().then(() => {
                console.log("Succesfully registered");
                response.render("secrets");
            }).catch((err) => {
                console.log("Registration failed");
                response.redirect('/register');
            });
        }
    });
});
// Handling login post request 
app.post('/login', (request, response) => {
    var username = request.body.username;

    User.findOne({ email: username }).then((user) => {
        bcrypt.compare(request.body.password,user.password,(err,result)=>{
            if(err){
                response.redirect('/login');
            }else{
                if(result){
                    response.render('secrets');
                }else{
                    response.redirect('/login');
                }
            }
        });
    }).catch((err) => {
        console.log("Error fetching user");
    });
});