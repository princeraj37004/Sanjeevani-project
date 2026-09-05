const jsonDb = require('./utils/jsonDb');

// Define our collections
const User = jsonDb.model('User');
const Activity = jsonDb.model('Activity');
const CaseAlert = jsonDb.model('CaseAlert');
const Community = jsonDb.model('Community');
const Patient = jsonDb.model('Patient');

module.exports = {
  User,
  Activity,
  CaseAlert,
  Community,
  Patient
};
