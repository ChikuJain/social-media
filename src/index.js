const express = require('express');
const route = require('./routes/routes.js');
const cors = require('cors')
const { default: mongoose } = require('mongoose');
const app = express();
const cookieParser = require("cookie-parser")

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static("build"))


mongoose.connect(process.env.DB, {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/', route);

app.listen(process.env.PORT || 4000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 4000))
});