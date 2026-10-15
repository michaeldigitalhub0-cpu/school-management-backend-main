
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { AppError, NotFoundError } = require('./middleware/errorHandler');
const { client_url } = require('./config/constants')
const router = require('./routes/index');

const app = express();

app.use(cors({ origin: client_url, credentials: true, optionsSuccessStatus: 204 }));
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router)

app.use((req, res, next) => next(new NotFoundError()));

app.use(AppError);

module.exports = app;
