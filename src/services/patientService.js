import { apiRequest } from "../utils/api";

export async function getPatients() {
  return await apiRequest("/patients");
}

export async function getPatient(id) {
  return await apiRequest(`/patients/${id}`);
}

export async function addPatient(patient) {
  return await apiRequest("/patients", {
    method: "POST",
    body: JSON.stringify(patient),
  });
}

export async function updatePatient(patient) {
  return await apiRequest(`/patients/${patient._id}`, {
    method: "PUT",
    body: JSON.stringify(patient),
  });
}

export async function deletePatient(id) {
  return await apiRequest(`/patients/${id}`, {
    method: "DELETE",
  });
}