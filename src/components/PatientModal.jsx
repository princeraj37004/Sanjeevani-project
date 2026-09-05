import React from "react";
import {
  X,
  User,
  Calendar,
  MapPin,
  HeartPulse,
  Activity,
} from "lucide-react";
import "./PatientModal.css";

export default function PatientModal({ patient, onClose }) {
  if (!patient) return null;

  return (
    <div className="modal-overlay">
      <div className="patient-modal">
        <div className="modal-header">
          <h2>Patient Details</h2>

          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="patient-avatar">
          <User size={50} />
        </div>

        <div className="patient-grid">
          <div>
            <label>Name</label>
            <p>{patient.name || "-"}</p>
          </div>

          <div>
            <label>Age</label>
            <p>
              <Calendar size={16} /> {patient.age} Years
            </p>
          </div>

          <div>
            <label>Gender</label>
            <p>{patient.gender}</p>
          </div>

          <div>
            <label>Village</label>
            <p>
              <MapPin size={16} /> {patient.village}
            </p>
          </div>

          <div>
            <label>Disease</label>
            <p>
              <HeartPulse size={16} /> {patient.disease}
            </p>
          </div>

          <div>
            <label>Status</label>
            <span className={`status ${(patient.status || "active").toLowerCase()}`}>
              <Activity size={15} />
              {patient.status || "Active"}
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}