// const express = require('express'); // CommonJS
// or ...
import express from 'express'; // ES Modules

const app = express();

const users = []

app.use(express.json()); // use body parser


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

/**
 * REST API
 * Users:
 * id
 * name
 * email
 * password
 * role
 * is_active
 */
app.get('/users', (req, res) => {
    res.json({
        status: 200,
        success: true,
        data: users
    });
});

app.post('/users', (req, res) => {
    const user = req.body;
    
    if (!user.name || !user.email || !user.password || !user.role) {
        res.json({
            status: 400,
            success: false,
            message: "Bad Request"
        });
    }

    if (users.find(u => u.email === user.email)) {
        res.json({
            status: 400,
            success: false,
            message: "Email already exists"
        });
    }else{
        user["id"]= users.length + 1;
        user["is_active"] = false;
        users.push(user);
    
        res.json({
            status: 201,
            success: true,
            data: users
        });
    }
});

app.put('/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);

    if (!user) {
        res.json({
            status: 404,
            success: false,
            message: "User not found"
        });
    }
    if (users.find(u => u.email === req.body.email && u.id !== id)) {
        res.json({
            status: 400,
            success: false,
            message: "Email already exists"
        });
    }else{
        user.name = req.body.name ?? user.name;
        user.email = req.body.email ?? user.email;
        user.password = req.body.password ?? user.password;
        user.role = req.body.role ?? user.role;

        res.json({
            status: 201,
            success: true,
            data: users
        });
    }
});

app.patch('/users/activate/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);

    if (!user) {
        res.json({
            status: 404,
            success: false,
            message: "User not found"
        });
    }else{
        user.is_active = true;
        res.json({
            status: 201,
            success: true,
            data: users
        });
    }
});

app.delete('/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);

    if (!user) {
        res.json({
            status: 404,
            success: false,
            message: "User not found"
        });
    }else{
        users.splice(users.indexOf(user), 1);

        res.json({
            status: 200,
            success: true,
            data: users
        });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});