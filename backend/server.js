const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Path to our JSON database file
const DB_FILE = path.join(__dirname, 'db.json');

// Helper function to read data from db.json
function readData() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database file:', error.message);
        return { submissions: [] }; // Return an empty structure if file is not found or corrupted
    }
}

// Helper function to write data to db.json
function writeData(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing to database file:', error.message);
    }
}

// Ensure db.json exists with an initial structure if it doesn't
if (!fs.existsSync(DB_FILE)) {
    writeData({ submissions: [] });
}

// API endpoint to get all contact form submissions
app.get('/api/submissions', (req, res) => {
    const data = readData();
    res.json(data.submissions);
});

// API endpoint to submit a new contact form entry
app.post('/api/submissions', (req, res) => {
    const newSubmission = req.body;
    if (!newSubmission.name || !newSubmission.email || !newSubmission.message) {
        return res.status(400).json({ message: 'All fields (name, email, message) are required.' });
    }

    const data = readData();
    newSubmission.id = Date.now().toString(); // Simple unique ID
    data.submissions.push(newSubmission);
    writeData(data);
    res.status(201).json({ message: 'Submission received successfully!', submission: newSubmission });
});

// API endpoint to delete a submission
app.delete('/api/submissions/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();
    const initialLength = data.submissions.length;
    data.submissions = data.submissions.filter(sub => sub.id !== id);

    if (data.submissions.length < initialLength) {
        writeData(data);
        res.status(200).json({ message: 'Submission deleted successfully.' });
    } else {
        res.status(404).json({ message: 'Submission not found.' });
    }
});

// Basic Login (for demonstration purposes)
// In a real application, this would involve proper authentication
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Super basic validation
    if (username === 'admin' && password === 'password') {
        res.status(200).json({ success: true, message: 'Login successful!' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
