import React from "react";
import "./DeletePatientModal.css";
import { Trash2 } from "lucide-react";

export default function DeletePatientModal({
  patient,
  onDelete,
  onCancel,
}) {
  if (!patient) return null;

  return (
    <div className="delete-overlay">
      <div className="delete-modal">

        <div className="delete-icon">
          <Trash2 size={40}/>
        </div>

        <h2>Delete Patient</h2>

        <p>
          Are you sure you want to delete
          <strong> {patient.name}</strong> ?
        </p>

        <div className="delete-buttons">

          <button
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="delete-btn"
            onClick={()=>onDelete(patient._id)}
          >
            Delete
          </button>

        </div>

      </div>
    </div>
  );
}