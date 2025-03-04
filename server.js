// const express = require('express'); // CommonJS
// or ...
import express from 'express'; // ES Modules

const app = express();

app.get('/', (req, res) => {
    res.send('Hello, Backend!');
});
app.get('/tambah', (req, res) => {
    res.send(20+10);
});
app.get('/kurang', (req, res) => {
    res.send(20-10);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});