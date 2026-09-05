import React, { useEffect, useMemo, useState } from "react";
import "./Patients.css";

import {
  Users,
  Search,
  UserPlus,
  Eye,
  Pencil,
  Trash2,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  User,
  MapPin,
  Activity,
} from "lucide-react";

import PatientModal from "../components/PatientModal";
import PatientForm from "../components/PatientForm";
import DeletePatientModal from "../components/DeletePatientModal";

import {
  getPatients,
  addPatient,
  updatePatient,
  deletePatient,
} from "../services/patientService";

export default function Patients() {

  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [village, setVillage] = useState("All");

  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [showDetails, setShowDetails] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [editingPatient, setEditingPatient] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);

  const [patientToDelete, setPatientToDelete] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      setLoading(true);

      const data = await getPatients();

      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }
  const villages = useMemo(() => {
    return [
      "All",
      ...new Set(patients.map((p) => p.village).filter(Boolean)),
    ];
  }, [patients]);

  const filteredPatients = useMemo(() => {
  console.log("Status Filter =", statusFilter);

  return patients.filter((p) => {
    const searchMatch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.disease.toLowerCase().includes(search.toLowerCase());

    const villageMatch =
      village === "All" || p.village === village;

    const statusMatch =
      statusFilter === "All" || p.status === statusFilter;

    return searchMatch && villageMatch && statusMatch;
  });
}, [patients, search, village, statusFilter]);

  const totalPatients = patients.length;

  const activePatients = patients.filter(
    (p) => p.status === "Active"
  ).length;

  const recoveredPatients = patients.filter(
    (p) => p.status === "Recovered"
  ).length;

  const criticalPatients = patients.filter(
    (p) => p.status === "Critical"
  ).length;

  function handleAddPatient(patient) {

    addPatient(patient);

    loadPatients();

    setShowForm(false);

  }

  function handleUpdatePatient(patient) {

    updatePatient(patient);

    loadPatients();

    setEditingPatient(null);

    setShowForm(false);

  }

  function handleDelete(id) {

    deletePatient(id);

    loadPatients();

    setDeleteModal(false);

    setPatientToDelete(null);

  }

  function openEdit(patient) {

    setEditingPatient(patient);

    setShowForm(true);

  }

  function openDetails(patient) {

    setSelectedPatient(patient);

    setShowDetails(true);

  }

  function openDelete(patient) {

    setPatientToDelete(patient);

    setDeleteModal(true);

  }

  return (

    <div className="patients-page">
      {/* Header */}

      <div className="page-header">

        <div>

          <h1>Patients Management</h1>

          <p>Manage and monitor all registered patients</p>

        </div>

        <button
          className="add-btn"
          onClick={() => {
            setEditingPatient(null);
            setShowForm(true);
          }}
        >
          <UserPlus size={18} />
          Add Patient
        </button>

      </div>

      {/* Statistics */}

      <div className="stats-grid">

        <div
  className="stat-card"
  onClick={() => {
    console.log("Total clicked");
    setStatusFilter("All");
  }}
>


          <Users size={28} />

          <div>

            <h2>{totalPatients}</h2>

            <span>Total Patients</span>

          </div>

        </div>

        <div className="stat-card success"
          onClick={() => setStatusFilter("Recovered")}
          style={{ cursor: "pointer" }}
          >
          <CheckCircle2 size={28} />

          <div>

            <h2>{recoveredPatients}</h2>

            <span>Recovered</span>

          </div>

        </div>

        <div className="stat-card warning"
          onClick={() => setStatusFilter("Active")}
          style={{ cursor: "pointer" }}
          >
          <HeartPulse size={28} />

          <div>

            <h2>{activePatients}</h2>

            <span>Active Cases</span>

          </div>

        </div>

        <div className="stat-card danger"
          onClick={() => setStatusFilter("Critical")}
          style={{ cursor: "pointer" }}
          >
          <AlertTriangle size={28} />

          <div>

            <h2>{criticalPatients}</h2>

            <span>Critical</span>

          </div>

        </div>

      </div>

      {/* Search */}

      <div className="toolbar">

        <div className="search-box">

          <Search size={18} />

          <input
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <select
          value={village}
          onChange={(e) => setVillage(e.target.value)}
        >

          {villages.map((v) => (
            <option key={v}>{v}</option>
          ))}

        </select>

      </div>

      {/* Table */}

      <div className="table-card">

        <table>

          <thead>

            <tr>

              <th>Patient</th>

              <th>Village</th>

              <th>Disease</th>

              <th>Age</th>

              <th>Status</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td colSpan="6" align="center">

                  Loading...

                </td>

              </tr>

            ) : (

              filteredPatients.map((patient) => (

                <tr key={patient._id}>

                  <td>

                    <div className="patient-info">

                      <div className="avatar">

                        <User size={18} />

                      </div>

                      <div>

                        <strong>{patient.name}</strong>

                        <small>

                          <Activity size={12} />

                          {patient.gender}

                        </small>

                      </div>

                    </div>

                  </td>

                  <td>

                    <span className="village">

                      <MapPin size={14} />

                      {patient.village}

                    </span>

                  </td>

                  <td>{patient.disease}</td>

                  <td>{patient.age}</td>

                  <td>
                    <span
                      className={`status ${(patient.status || "active").toLowerCase()}`}
                    >
                      {patient.status || "Active"}
                    </span>
                  </td>

                  <td>

                    <div className="action-buttons">

                      <button
                        className="view-btn"
                        onClick={() => openDetails(patient)}
                      >

                        <Eye size={16} />

                      </button>

                      <button
                        className="edit-btn"
                        onClick={() => openEdit(patient)}
                      >

                        <Pencil size={16} />

                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => openDelete(patient)}
                      >

                        <Trash2 size={16} />

                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>
      {/* Patient Details Modal */}

      {showDetails && (
        <PatientModal
          patient={selectedPatient}
          onClose={() => {
            setShowDetails(false);
            setSelectedPatient(null);
          }}
        />
      )}

      {/* Add/Edit Form */}

      {showForm && (
        <PatientForm
          patient={editingPatient}
          onSave={(patient) => {
            if (editingPatient) {
              handleUpdatePatient(patient);
            } else {
              handleAddPatient(patient);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingPatient(null);
          }}
        />
      )}

      {/* Delete Modal */}

      {deleteModal && (
        <DeletePatientModal
          patient={patientToDelete}
          onDelete={handleDelete}
          onCancel={() => {
            setDeleteModal(false);
            setPatientToDelete(null);
          }}
        />
      )}

    </div>

  );

}