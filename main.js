const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const dbFile = path.join(__dirname, 'contacts.db');
const dbExists = fs.existsSync(dbFile);
const db = new sqlite3.Database(dbFile, err => {
    if (err) return console.error('Error opening database', err);
    if (!dbExists) {
        db.run("CREATE TABLE contacts (id INTEGER PRIMARY KEY, name TEXT, number TEXT, email TEXT, group_name TEXT)", err => {
            if (err) console.error('Error creating table', err);
        });
    }
});

const expressApp = express();
expressApp.use(bodyParser.json());

expressApp.post('/addContact', (req, res) => {
    const { name, number, email, group } = req.body;
    db.run("INSERT INTO contacts (name, number, email, group_name) VALUES (?, ?, ?, ?)", [name, number, email, group], function(err) {
        if (err) return res.status(500).send(err.message);
        res.send({ id: this.lastID });
    });
});

expressApp.get('/contacts', (req, res) => {
    db.all("SELECT * FROM contacts", [], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.send(rows);
    });
});

expressApp.post('/updateContact', (req, res) => {
    const { id, group } = req.body;
    db.run("UPDATE contacts SET group_name = ? WHERE id = ?", [group, id], function(err) {
        if (err) return res.status(500).send(err.message);
        res.send({ changes: this.changes });
    });
});

expressApp.post('/removeContact', (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM contacts WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).send(err.message);
        res.send({ changes: this.changes });
    });
});

expressApp.listen(3000, () => console.log('Server running on port 3000'));

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});


