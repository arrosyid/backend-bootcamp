// const express = require('express'); // CommonJS
// or ...
import express from 'express'; // ES Modules

const app = express();

app.get('/', (req, res) => {
    res.send('Hello, Backend!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});