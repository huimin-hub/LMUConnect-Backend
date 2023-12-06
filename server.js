const express = require('express');
const connectToDB = require('./db');
const https = require("https");
const fs = require("fs");
const helmet = require("helmet");

const options = {
    key: fs.readFileSync("/etc/letsencrypt/live/msp-ws2223-4.dev.mobile.ifi.lmu.de/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/msp-ws2223-4.dev.mobile.ifi.lmu.de/fullchain.pem")
};


const app = express();
const port = process.env.PORT || 8080
console.log("Server starting...")

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); //website allowed to connect
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE'); // Request methods allowed
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'); //Request headers allowed
    next();
});

app.use(express.json({ limit: '10MB' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
require('./routes/authRoutes.js')(app)
require('./routes/menuRoutes.js')(app)
require('./routes/social/profileRoutes.js')(app)
require('./routes/social/friendsListRoutes.js')(app)
require('./routes/social/matrixRoutes.js')(app)
require('./routes/study/coursesRoutes.js')(app)
require('./routes/study/eventsRoutes.js')(app)
require('./routes/homeRoutes.js')(app)
require('./routes/fileRoutes.js')(app)
connectToDB()

//app.listen(port, "0.0.0.0", () => console.log(`Server is running on ${port}`))

https.createServer(options, app).listen(port, "0.0.0.0", () => console.log(`Server is running on port ${port}`))