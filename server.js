// const express = require('express'); // CommonJS
// or ...
import express, { json } from 'express'; // ES Modules
import jwt from 'jsonwebtoken';
import connectMySQL from './connectMySQL.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// import https from 'https';
// import morgan from 'morgan';
import cors from 'cors';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// app ...
// let users = []
// let Tasks = []

app.use(express.json()); // use body parser

// app.use(morgan("dev"));

// app.get("/", (req, res) => {
//     res.send("WELCOME TO THE BASIC EXPRESS APP WITH AN HTTPS SERVER");
// });

// const options = {
//     key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
//     cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
//     // passphrase: 'password'
// }
// const PORT = 443;

// // Create HTTPS server
// https.createServer(options, app)
//     .listen(PORT, () => {
//         console.log(`Server running on https://localhost:${PORT}`);
//     });

// Configure CORS
app.use(cors({
    origin: 'https://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Configure rate limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));

// // const connection = await connectMySQL();
// app.use(async (req, res, next) => {
//     const connection = await connectMySQL();
//     if (connection) {
//         console.log("Database is connected");
//         // console.log(req.method, req.url);
//         await connection.end(); // Menutup koneksi setelah digunakan
//         next();
//     }else{
//         console.log("Database is not connected");
//         return res.status(500).send("Database is not connected");
//     }
// })
// global midleware

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const useToken = (req, res, next) => {
    const token = req.headers['authorization'].split(' ')[1];
    // console.log(token);
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, 'secret');
        req.user = decoded;
        // req.user.role = decoded.role
        console.log(req.user);
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// role access function with argument array roles
const roleAccess = (roles) => {
    return (req, res, next) => {
        if (roles.includes(req.user.role)) {
            return next();
        }
        console.log(req.user);
        // console.log(req);
        return res.status(403).json({ message: 'You don\'t have permission to access this resource' });
    };
};

// multer for upload file
// Konfigurasi penyimpanan
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folder tujuan
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nama file unik
    }
});

// Filter tipe file
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('LIMIT_UNEXPECTED_FILE'), false);
    }
};

// Konfigurasi upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 1 * 1024 * 1024 }, // Maksimal 5MB
    fileFilter: fileFilter,
});

app.get(
    '/grant-access',
    useToken,
    roleAccess(['Admin', "User"]),
    (req, res) => {
        res.status(200).json({ 
            message: 'Access granted' 
        });
    }
);

app.post(
    '/login',
    async (req, res) => {
        const body = req.body;
        const connection = await connectMySQL();

        if (!body.email || !body.password) {
            return res.status(400).json({ 
                message: 'ID and role are required' 
            });
        }

        try {
            const [[user]] = await connection.execute('SELECT * FROM users WHERE email = ?', [body.email]);
            if(body.email == user.email && body.password == user.password){
                const token = jwt.sign({ id:user.id, role:user.role }, 'secret', { expiresIn: '1h' });
                return res.status(200).json({ 
                    message: 'Login successful', 
                    token: token 
                });
            }else{
                return res.status(401).json({ 
                    message: 'Invalid email or password' 
                });
            }
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                message: 'Internal server error' 
            });
        }finally{
            await connection.end();
        }
    }
);

app.get('/connect/mysql', async(req, res) => {
    const connection = await connectMySQL();
    if (connection) {
        await connection.end(); 
        return res.send('database is connected');
    }else{
        return res.send('database is not connected');
    }
})

app.get('/', (req, res) => {
    const origin = req.headers['origin'] || req.headers['host'] || '';
    if(origin.includes("localhost")){
        res.send('Hello, Backend!, from localhost');
    } else {
        res.send(`Hello, Bolo!, from ${origin}`);
    }
    // res.send('Hello, Backend!');
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
app.get('/users', useToken, roleAccess(['admin', "user"]),async (req, res) => {
    const connection = await connectMySQL();
    try {
        if(req.user.role == "admin"){
            const [users] = await connection.execute('SELECT * FROM users');
            users.map((user) => {
                if(user.avatar != ""){
                    user.avatar = `${req.protocol}://${req.get('host')}/file/${user.avatar}`
                }
            }); 
            // console.log("user data:", users);
            res.status(200).json({
                success: true,
                data: users
            });
        }else{
            const [[user]] = await connection.execute('SELECT * FROM users WHERE id = ?', [req.user.id]); 

            if(user.avatar != ""){
                user.avatar = `${req.protocol}://${req.get('host')}/file/${user.avatar}`
            }
            res.status(200).json({
                success: true,
                data: user
            });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    } finally {
        await connection.end(); // Tutup koneksi
    }
});

const ErrorHandler = (err, req, res, next) => {
    console.log(err);
    if(err.message == 'LIMIT_UNEXPECTED_FILE'){
        res.status(400).json({
            success: false,
            message: "File type not allowed must be image"
        })
    } else if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
            success: false,
            message: "File size too large"
        })
    } else {
        next()
    }
}

app.post('/users', 
    useToken, 
    roleAccess(['admin']), 
    upload.single('avatar'), 
    ErrorHandler, 
    async (req, res) => {
        const user = req.body;
        
        if (!user.name || !user.email || !user.password || !user.role) {
            return res.status(400).json({
                success: false,
                message: "Bad Request"
            });
        }
        
        const connection = await connectMySQL();
        try {
            const existingUser = await connection.execute('SELECT * FROM users WHERE email = ?', [user.email]);
            // console.log("user data:", users);
            // if (users.find(u => u.email === user.email)) {
            if (existingUser[0].length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists"
                });
            }else{
                // user["id"]= users.length + 1;
                user["is_active"] = false;
                // users.push(user);

                let avatar = "";
                if (req?.file && req.file?.filename) {
                    // upload
                    avatar = req.file.filename;
                }
                    
                await connection.execute('INSERT INTO users (name, email, password, role, is_active, avatar) VALUES (?, ?, ?, ?, ?, ?)', 
                    [user.name, user.email, user.password, user.role, user.is_active, avatar]);
                const [users] = await connection.execute('SELECT * FROM users'); 
            
                res.status(201).json({
                    success: true,
                    data: users
                });
            }
        } catch (error) {
            console.error("Query error:", error.message);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        } finally {
            await connection.end(); // Tutup koneksi
        } 
});

app.put('/users/:id', 
    useToken, 
    roleAccess(['admin', "user"]), 
    upload.single('avatar'), 
    ErrorHandler,
    async (req, res) => {
        const id = parseInt(req.params.id);
        // const user = users.find(u => u.id === id);
        if (!req.body.name || !req.body.email || !req.body.password || !req.body.role) {
            return res.status(400).json({
                success: false,
                message: "Bad Request"
            });
        }
        const connection = await connectMySQL();
        try {
            const [user] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
            const [existingEmail] = await connection.execute('SELECT * FROM users WHERE email = ? AND id != ?', [req.body.email, id]);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
            // console.log(existingEmail);

            // if (users.find(u => u.email === req.body.email && u.id !== id)) {
            if (existingEmail.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists"
                });
            }

            let avatar = "";
            if (req?.file && req.file?.filename) {
                // upload
                avatar = req.file.filename;
            }

            await connection.execute('UPDATE users SET name = ?, email = ?, password = ?, role = ?, avatar = ? WHERE id = ?', 
                [req.body.name, req.body.email, req.body.password, req.body.role, avatar, id])
            const [users] = await connection.execute('SELECT * FROM users');
            // user.name = req.body.name ?? user.name;
            // user.email = req.body.email ?? user.email;
            // user.password = req.body.password ?? user.password;
            // user.role = req.body.role ?? user.role;

            res.status(200).json({
                success: true,
                data: users
            });
            
        } catch (error) {
            console.error("Query error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        } finally {
            await connection.end(); // Tutup koneksi
        }
});

app.patch('/users/activate/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    // const user = users.find(u => u.id === id);
    
    const connection = await connectMySQL();
    try {
        const [user] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        // user.is_active = true;
        await connection.execute('UPDATE users SET is_active = ? WHERE id = ?', 
            [true, id])
        const [users] = await connection.execute('SELECT * FROM users');
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error("Query error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    } finally {
        await connection.end(); // Tutup koneksi
    }
});

app.delete('/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    const connection = await connectMySQL();
    try {
        const [user] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        await connection.execute('DELETE FROM users WHERE id = ?', [id]);
        const [users] = await connection.execute('SELECT * FROM users');

        res.status(200).json({
            success: true,
            data: users
        })
    } catch (error) {
        console.error("Query error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    } finally {
        await connection.end(); // Tutup koneksi
    }
});

/**
 * REST API
 * Tasks:
 * id
 * user_id
 * tittle
 * description
 * is_done
 */

// Local Middleware
const localMiddleware = async (req, res, next) => {
    // console.log(req.headers.user_id);
    if (!req.headers.user_id) {
        res.status(401).json({
            success: false,
            message: "Unauthorized" 
        });
        // next();
    }else{
        const connection = await connectMySQL();
        try {
            // const user = users.find(u => u.id === parseInt(req.headers.user_id));
            const [user] = await connection.execute('SELECT * FROM users WHERE id = ?', [req.headers.user_id]);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "Users Not Found" 
                });
                connection.end();
            }else{
                // req.user = user;
                next();
            }
        }
        catch (error) {
            console.error("Query error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        } finally {
            await connection.end(); // Tutup koneksi
        }
    }
};

app.get('/tasks', localMiddleware, async(req, res) => {
    const connection = await connectMySQL();
    try {
        const [Tasks] = await connection.execute('SELECT * FROM tasks where user_id = ?', [req.headers.user_id]);
        // console.log("user data:", users);
        res.status(200).json({
            success: true,
            data: Tasks
        });
    } catch (error) {
        console.error("Query error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    } finally {
        await connection.end(); // Tutup koneksi
    }
    // const connection = await connectMySQL();
    // const [Tasks] = await connection.execute('SELECT * FROM tasks where user_id = ?', [req.headers.user_id]);
    // res.status(200).json({
    //     status: 200,
    //     success: true,
    //     data: Tasks
    // });
});

app.post('/tasks',localMiddleware, async(req, res) => {
    const task = req.body;
    
    if (!task.tittle || !task.description) {
        return res.status(400).json({
            success: false,
            message: "Bad Request"
        });
    }
    
    const connection = await connectMySQL();
    try {
        // const existingTask = await connection.execute('SELECT * FROM tasks WHERE tittle = ? AND user_id = ?', [task.tittle, req.headers.user_id]);
        // // console.log("user data:", users);
        // // if (users.find(u => u.email === user.email)) {
        // if (existingTask[0].length > 0) {
        //     res.status(200).json({
        //         status: 400,
        //         success: false,
        //         message: "Task already exists"
        //     });
        // }
        
        await connection.execute('INSERT INTO tasks (user_id, tittle, description, is_done) VALUES (?, ?, ?, ?)',
            [req.headers.user_id, task.tittle, task.description, false]);
        const [Tasks] = await connection.execute('SELECT * FROM tasks where user_id = ?', [req.headers.user_id]);
        // task["id"]= Tasks.length + 1;
        // task["is_done"] = false;
        // Tasks.push(task);
    
        res.status(201).json({
            success: true,
            data: Tasks
        });
    } catch (error) {
        console.error("Query error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }finally {
        await connection.end();
    }
});

app.put('/tasks/:id', localMiddleware, async(req, res) => {
    const id = parseInt(req.params.id);
    // const task = Tasks.find(t => t.id === id);
    if (!req.body.tittle || !req.body.description) {
        return res.status(400).json({
            success: false,
            message: "Bad Request"
        });
    }
    
    const connection = await connectMySQL();
    try {
        const [task] = await connection.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task Not Found"
            });
        }

        await connection.execute('UPDATE tasks SET tittle = ?, description = ?, is_done = ? WHERE id = ?', 
            [req.body.tittle, req.body.description, task[0].is_done, id])
        const [Tasks] = await connection.execute('SELECT * FROM tasks where user_id = ?', [req.headers.user_id]);

        // task.user_id = req.body.user_id ?? task.user_id;
        // task.tittle = req.body.tittle ?? task.tittle;
        // task.description = req.body.description ?? task.description;
        // task.is_done = req.body.is_done ?? task.is_done;

        res.status(200).json({
            success: true,
            data: Tasks
        });
    } catch (error) {
        console.error("Query error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }finally {
        await connection.end();
    }
});

app.patch('/tasks/done/:id', localMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    // const task = Tasks.find(u => u.id === id);
    
    const connection = await connectMySQL();
    try {
        const [task] = await connection.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task Not Found"
            });
        }

        await connection.execute('UPDATE tasks SET is_done = ? WHERE id = ?', 
            [true, id])
        const [Tasks] = await connection.execute('SELECT * FROM tasks where user_id = ?', [req.headers.user_id]);
        res.status(200).json({
            success: true,
            data: Tasks
        });
    } catch (error) {
        console.error("Query error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }finally {
        await connection.end();
    }
});

app.delete('/tasks/:id', localMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    // const task = Tasks.find(u => u.id === id);
    
    const connection = await connectMySQL();
    try {
        const [task] = await connection.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task Not Found"
            });
        }

        // Tasks = Tasks.filter(u => u.id !== id);
        await connection.execute('DELETE FROM tasks WHERE id = ?', [id]);
        const [Tasks] = await connection.execute('SELECT * FROM tasks where user_id = ?', [req.headers.user_id]);

        res.status(200).json({
            success: true,
            data: Tasks
        });
    } catch (error) {
        console.error("Query error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }finally {
        await connection.end();
    }
});


// routes for endpoint uploads
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    res.send('File uploaded successfully:' + req.file.filename);
});

app.get('/file/:filename', (req, res) => {
    try {
        if (!req.params.filename) {
            throw new Error('File not found');
        }

        const filePath = path.join(__dirname, 'uploads', req.params.filename);
        res.sendFile(filePath);
        if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
        }
        // res.download(filePath);
        res.status(200).json({ 
            message: 'File berhasil diunduh' 
        });
    } catch (error) {
        return res.status(404).json({ 
            message: error.message 
        });
    }
});

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-cbc';
        this.key = crypto.randomBytes(32);
        this.iv = crypto.randomBytes(16);
    }
    encrypt(text) {
        const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    decrypt(encrypted) {
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
app.post('/secure-data', (req, res) => {
    const encryption = new EncryptionService();
    const { data } = req.body;

    // Encrypt sensitive data
    const encrypted = encryption.encrypt(data);

    // Store encrypted data...

    return res.status(200).json({
        message: 'Data encrypted successfully',
        encrypted
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});