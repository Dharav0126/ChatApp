// Connecting the database with chaining method
const mongoose = require('mongoose');

// import dotenv
require('dotenv').config();

const configuration = {
    connectionString:{
        MongoDB: process.env.ConnectionString
    }
}

module.exports = configuration;