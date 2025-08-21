const KEY = "wt_reports_v1";


//here we will add reports from the api when we can
export function getReports() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export function addReport(report) {
  const list = getReports();
  const item = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...report };
  localStorage.setItem(KEY, JSON.stringify([item, ...list]));
  return item;
}