const express = require("express");
const router = express.Router();

let patients = [
  {
    _id: "1",
    name: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    village: "Rampur",
    disease: "Diabetes",
    status: "Active"
  },
  {
    _id: "2",
    name: "Sita Devi",
    age: 32,
    gender: "Female",
    village: "Rampur",
    disease: "Pregnancy Checkup",
    status: "Recovered"
  },
  {
    _id: "3",
    name: "Rahul Singh",
    age: 10,
    gender: "Male",
    village: "Gopalpur",
    disease: "Fever",
    status: "Recovered"
  },
  {
    _id: "4",
    name: "Anita Kumari",
    age: 60,
    gender: "Female",
    village: "Karanpur",
    disease: "Hypertension",
    status: "Critical"
  },
  {
    _id: "5",
    name: "Mohan Yadav",
    age: 52,
    gender: "Male",
    village: "Bihta",
    disease: "Heart Disease",
    status: "Critical"
  }
];

// Get all
router.get("/", (req, res) => {
  res.json(patients);
});

// Get one
router.get("/:id", (req, res) => {
  const patient = patients.find(p => p._id === req.params.id);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  res.json(patient);
});

// Add
router.post("/", (req, res) => {
  const patient = {
    _id: Date.now().toString(),
    ...req.body
  };

  patients.push(patient);

  res.status(201).json(patient);
});

// Update
router.put("/:id", (req, res) => {
  const index = patients.findIndex(p => p._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Patient not found" });
  }

  patients[index] = {
    ...patients[index],
    ...req.body
  };

  res.json(patients[index]);
});

// Delete
router.delete("/:id", (req, res) => {
  patients = patients.filter(p => p._id !== req.params.id);

  res.json({ message: "Patient deleted" });
});

module.exports = router;