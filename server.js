const express = require('express');
const bodyParser = require('body-parser');
const Datastore = require('nedb');

const app = express();
const PORT = 3000;

// Database setup
const db = new Datastore({ filename: 'timerStats.db', autoload: true });

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// API to save a timer statistic
app.post('/api/save', (req, res) => {
    const statistic = {
        label: req.body.label,
        time: req.body.time,
        start: req.body.start,
        end: req.body.end,
        createdAt: new Date()
    };
    db.insert(statistic, (err, newDoc) => {
        if (err) {
            res.status(500).send("Database error");
            return;
        }
        res.json(newDoc);
    });
});


// API to fetch all timer statistics
app.get('/api/stats', (req, res) => {
    db.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
        if (err) {
            res.status(500).send("Database error");
            return;
        }
        res.json(docs);
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
