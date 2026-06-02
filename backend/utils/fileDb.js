const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');
const otpsFilePath = path.join(__dirname, '../data/otps.json');
const auditsFilePath = path.join(__dirname, '../data/audit.json');

function ensureFile(filePath, defaultContent = '[]') {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, defaultContent, 'utf8');
  }
}

function readUsers() {
  try {
    ensureFile(usersFilePath);
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users JSON database:', err);
    return [];
  }
}

function writeUsers(users) {
  try {
    ensureFile(usersFilePath);
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users JSON database:', err);
  }
}

function readOtps() {
  try {
    ensureFile(otpsFilePath);
    const data = fs.readFileSync(otpsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading OTPs JSON database:', err);
    return [];
  }
}

function writeOtps(otps) {
  try {
    ensureFile(otpsFilePath);
    fs.writeFileSync(otpsFilePath, JSON.stringify(otps, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing OTPs JSON database:', err);
  }
}

function readAudits() {
  try {
    ensureFile(auditsFilePath);
    const data = fs.readFileSync(auditsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading audit JSON database:', err);
    return [];
  }
}

function writeAudits(audits) {
  try {
    ensureFile(auditsFilePath);
    fs.writeFileSync(auditsFilePath, JSON.stringify(audits, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing audit JSON database:', err);
  }
}

module.exports = { read: readUsers, write: writeUsers, readOtps, writeOtps, readAudits, writeAudits };