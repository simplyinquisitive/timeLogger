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
        pauseTimes: req.body.pauseTimes || [], // Default to empty array if not provided
        resumeTimes: req.body.resumeTimes || [], // Default to empty array if not provided
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

app.get('/api/specStats', (req, res) => {
    if (!req.query.date) {
        return res.status(400).send("Date query parameter is required.");
    }

    // Convert the 'en-IN' local date to the UTC date range for filtering
    const utcStartDate = convertLocalDateToUTC(req.query.date);
    const utcEndDate = new Date(utcStartDate);
    utcEndDate.setDate(utcEndDate.getDate() + 1);

    db.find({ 
        start: { $gte: utcStartDate.toISOString(), $lt: utcEndDate.toISOString() } 
    }).sort({ createdAt: -1 }).exec((err, docs) => {
        if (err) {
            res.status(500).send("Database error");
            return;
        }
        res.json(docs);
    });
});

// API to fetch unique labels
app.get('/api/labels', (req, res) => {
    db.find({}).exec((err, docs) => {
        if (err) {
            res.status(500).send("Database error");
            return;
        }
        // Extract unique labels
        const labels = [...new Set(docs.map(doc => doc.label))];
        res.json(labels);
    });
});

app.delete('/api/delete/:id', (req, res) => {
    const { id } = req.params; // Extract the ID from the request parameters
    db.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) {
            res.status(500).send("Database error");
            return;
        }
        if (numRemoved) {
            res.json({ message: 'Deleted successfully', _id: id });
        } else {
            res.status(404).send("Not Found");
        }
    });
});

// API to delete all timer statistics
app.delete('/api/delete-all', (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) {
            res.status(500).send("Database error");
            return;
        }
        res.json({ message: `Deleted successfully: ${numRemoved} entries` });
    });
});

/**
 * Converts a local date string in 'YYYY-MM-DD' format to a UTC Date object at 00:00:00 UTC.
 * @param {string} dateString - The local date string in 'YYYY-MM-DD' format.
 * @return {Date} - The UTC Date object representing the start of the given date in UTC.
 */
function convertLocalDateToUTC(dateString) {
    // Parse the date string as local time
    const localDate = new Date(dateString);
    // Adjust for the timezone offset to get to UTC
    // Note: This simplistic approach assumes the server's local timezone offset is consistent with the 'en-IN' timezone.
    const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
    return utcDate;
}