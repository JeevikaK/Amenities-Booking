const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const data = require('./models/schema');
const signup = require('./models/schema_signup');
const ejs = require('ejs');
const { response } = require('express');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');

const app = express();

app.set('view engine', 'ejs');

const dbURI = "mongodb+srv://JeevikaK:Jeevika%402001@datas.howyjrm.mongodb.net/datas?retryWrites=true&w=majority";
mongoose.connect(dbURI)
    .then((result) => {
        app.listen(process.env.PORT || 3000)
        console.log('Connected to MongoDB')
    })
    .catch((err) => console.log(err))

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

app.get('/', (req, res) =>{
    res.render('login', {message: "", title: "Login"});
}); 

app.post('/', async (req, res) => {
    const {username, password} = req.body
    req.session.username = username
    req.session.password = password
    console.log( req.session.username,req.session.password)
    signup.findOne({username: username, password: password})
        .then((result) => {
            if(!(result == null)){
                res.render('home', {title: 'Home'})
            }
            else{
                res.render('login', {message: "Username or Password incorrect", title: "Login"})
            }
        })
        .catch((err) => {
            console.log(err)
    })
    req.session.booking_id = Math.floor(Math.random() * 10000) + 1;
    var filter = {username : username, password: password, booking_id: req.session.booking_id}
    await data.create(filter);

})

app.post('/signup', (req, res) => {
    const {name, username, phone, email, password, confirm_password} = req.body
    console.log(name, username, phone, email, password, confirm_password)
    signup.findOne({username: username})
    .then((result) => {
        if(!(result == null)){
            res.render('signup', {message: "Username already exists!", title: "Login"})
        }
        else if(password != confirm_password){
            res.render('signup', {title: 'Signup', message: "Passwords do not match. Please re-enter"})
        }
        else{
            console.log(result)
            const store = new signup({ 
                name: name,
                username: username,
                phone: phone,
                email: email,
                password: password,
                confirm_password: confirm_password
            })
            store.save()
                .then((result) => {
                    res.redirect('home');
                })
                .catch((err) => {
                    console.log(err);
            });
        }
    })
    .catch((err) => {
        console.log(err)
    })
})

app.get('/home', (req, res) =>{
    const username = req.session.username
    const password = req.session.password
    console.log(username, password)
    if(!username || !password){
        res.redirect('/')
    }
    else{
        res.render('home', {title: "Home"});
    }
        
});

app.get('/signup', (req, res) =>{
    res.render('signup', {title: "Signup", message: ""});
});

app.get('/book/:id', (req, res) =>{     
    const username = req.session.username
    const password = req.session.password
    req.session.temp = req.params.id;
    if(!username || !password){
        res.redirect('/')
    }
    else{
        res.render('book', {id : req.params.id, title: 'Book'});
        req.session.temp = req.params.id;
    }
});

app.post('/book/:id/getDate', (req, res) => {
    const {selectedDate, month, year} = req.body
    console.log(req.body)
    req.session.bookingDate = selectedDate+'-'+month+'-'+year
    BookingDate = req.session.bookingDate
    res.json({BookingDate})
})

app.post('/book/:id', async (req, res) => {
    const username = req.session.username
    const password = req.session.password
    const amenity = req.session.temp
    const booking_id = req.session.booking_id
    console.log(booking_id)
    console.log(amenity)
    
    var filter = {username : username, password: password, booking_id: booking_id}
    var update = {
        date: req.session.bookingDate,
        time: Object.values(req.body)[0],
        amenity: amenity,
        booking_id: booking_id
    }
    let doc = await data.findOneAndUpdate(filter, update, {
        new: true
    });

    res.redirect('/thankyou')
})


app.get('/viewBookings', (req, res) => {
    username = req.session.username
    password = req.session.password
    console.log(username, password)
    data.find({username: username, password: password})
        .then((result) => {
            if(!(result == null)){
                console.log(result)
                res.render('viewBookings', {title: 'View Bookings', result})
            }
            else{
                console.log('error')
            }
        })
        .catch((err) => {
            console.log(err)
    })
})

app.get('/thankyou', (req, res) => {
    const username = req.session.username
    const password = req.session.password
    const booking_id = req.session.booking_id
    console.log(booking_id)
    data.findOne({username: username, password: password, booking_id: booking_id})
        .then((result) => {
                console.log(result)
                res.render('thankyou', {title: "Booking Confirmed", booking_id:result.booking_id, amenity: result.amenity, time: result.time, date: result.date});
            })
        .catch((err) => {
            console.log(err)
    })  
})

app.post('/thankyou', (req, res) => {
    req.session.destroy()
    console.log('deleted')
    res.redirect('/')
})