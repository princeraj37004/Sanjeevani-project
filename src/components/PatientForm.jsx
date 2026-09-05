import React, { useState, useEffect } from "react";
import "./PatientForm.css";

export default function PatientForm({
  patient,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    village: "",
    disease: "",
    status: "Active",
  });

  useEffect(() => {
    if (patient) {
      setForm(patient);
    }
  }, [patient]);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (
      !form.name ||
      !form.age ||
      !form.village ||
      !form.disease
    ) {
      alert("Please fill all fields.");
      return;
    }

    onSave(form);
  }

  return (
    <div className="form-overlay">
      <form className="patient-form" onSubmit={handleSubmit}>

        <h2>
          {patient ? "Edit Patient" : "Add New Patient"}
        </h2>

        <input
          name="name"
          placeholder="Patient Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          type="number"
          name="age"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
        >
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <input
          name="village"
          placeholder="Village"
          value={form.village}
          onChange={handleChange}
        />

        <input
          name="disease"
          placeholder="Disease"
          value={form.disease}
          onChange={handleChange}
        />

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option>Active</option>
          <option>Recovered</option>
          <option>Critical</option>
        </select>

        <div className="form-buttons">
          <button
            type="button"
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="save-btn"
          >
            Save
          </button>
        </div>

      </form>
    </div>
  );
}