const KEY = "wt_reports_v1";


//here we will add reports from the api when we can
export function getReports() {
  return JSON.parse(localStorage.getItem("reports") || "[]");
}

export function addReport(report) {
  const reports = JSON.parse(localStorage.getItem("reports") || "[]");
  const user = localStorage.getItem("username") || "anonymous";
  const id = Date.now();
  const newReport = { ...report, id, user };
  reports.push(newReport);
  localStorage.setItem("reports", JSON.stringify(reports));
  return newReport;
}

export function updateReport(id, updatedFields) {
  const reports = getReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx !== -1) {
    reports[idx] = { ...reports[idx], ...updatedFields };
    localStorage.setItem("reports", JSON.stringify(reports));
  }
}

export function deleteReport(id) {
  let reports = getReports();
  reports = reports.filter(r => r.id !== id);
  localStorage.setItem("reports", JSON.stringify(reports));
}