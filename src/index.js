const 
    express         = require('express'),
    verifyJWT       = require('./middleware/verifyJWT'),
    mongoose        = require('mongoose'),
    cookieParser    = require('cookie-parser'),
    cors            = require('cors'),
    connectDB       = require('./config/dbConn');
    corsOptions     = require('./config/corsOptions'),

require('dotenv').config();


const PORT = process.env.PORT || 2000;

const app = express();

app.use(cors(corsOptions));

connectDB();
// MIDDLEWARE
app.use(express.json({limit: '10mb'}));

//middleware for cookies
app.use(cookieParser());

// routes AUTH + JWT
app.use('/auth',                require('./routes/auth'));
app.use('/refresh',             require('./routes/refresh'));
app.use('/logout',              require('./routes/logout'));

app.use('/hid/createuser',    require('./routes/register'));

app.use('/get', require('./routes/catalog'));

app.use(verifyJWT);
app.use('/cars',        require('./routes/car'));



mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});