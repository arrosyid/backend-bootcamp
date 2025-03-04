// const express = require('express'); // CommonJS
// or ...
import express from 'express'; // ES Modules

const app = express();

app.get('/', (req, res) => {
    res.send('Hello, Backend!');
});
app.get('/tambah', (req, res) => {
    res.send(`Hasil: ${20 + 10}`);
});
app.get('/kurang', (req, res) => {
    res.send(`Hasil: ${20 + 10}`);
});

app.get('/bagi/:a/:b', (req, res) => {
    const a = parseFloat(req.params.a);
    const b = parseFloat(req.params.b);

    if (isNaN(a) || isNaN(b)) {
        return res.status(400).send("Parameter harus berupa angka.");
    }

    if (b === 0) {
        return res.status(400).send("Tidak bisa membagi dengan nol.");
    }

    res.send(`Hasil: ${a / b}`);
});

app.get('/users', (req, res) => {
    res.send(req.query);
});
app.post('/users/:id', (req, res) => {
    res.send(req.query);
});
app.put('/users/:id', (req, res) => {
    res.send(req.query);
});
app.patch('/users/:id', (req, res) => {
    res.send(req.query);
});
app.delete('/users/:id', (req, res) => {
    res.send(req.query);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});