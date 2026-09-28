/**
 * student-details.js
 * ------------------
 * Powers student-details.html: shows one student's profile plus their
 * attendance summary (present/absent/late counts, rate, and full history).
 * Which student to show comes from the ?id= query parameter.
 */

document.addEventListener("DOMContentLoaded", () => {
  const profileCard = document.getElementById("student-profile-card");
  if (!profileCard) return; // Guard: only run on student-details.html

  const notFoundState = document.getElementById("student-not-found");
  const contentEl = document.getElementById("student-details-content");

  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("id");
  const student = studentId ? getStudentById(studentId) : null;

  if (!student) {
    contentEl.hidden = true;
    notFoundState.hidden = false;
    return;
  }

  notFoundState.hidden = true;
  contentEl.hidden = false;

  renderProfile(student);
  renderSummary(student);
  renderHistoryTable(student);

  function renderProfile(student) {
    document.getElementById("detail-fullname").textContent = student.fullName;
    document.getElementById("detail-studentid").textContent = student.studentId;
    document.getElementById("detail-class").textContent = student.class;
    document.getElementById("detail-gender").textContent = student.gender;
    document.getElementById("detail-age").textContent = student.age;
    document.getElementById("detail-phone").textContent = student.phone || "Not provided";
    document.getElementById("detail-initials").textContent = getInitials(student.fullName);
  }

  function renderSummary(student) {
    const records = getAttendanceForStudent(student.studentId);
    const present = records.filter((r) => r.status === "Present").length;
    const absent = records.filter((r) => r.status === "Absent").length;
    const late = records.filter((r) => r.status === "Late").length;
    const rate = calculateAttendanceRate(student.studentId);

    document.getElementById("detail-present-days").textContent = present;
    document.getElementById("detail-absent-days").textContent = absent;
    document.getElementById("detail-late-days").textContent = late;
    document.getElementById("detail-rate").textContent = `${rate}%`;
  }

  function renderHistoryTable(student) {
    const tableBody = document.getElementById("student-history-body");
    const emptyState = document.getElementById("student-history-empty");
    const records = getAttendanceForStudent(student.studentId);

    tableBody.innerHTML = "";

    if (records.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    records.forEach((record) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatDateForDisplay(record.date)}</td>
        <td><span class="status-badge status-badge--${record.status.toLowerCase()}">${record.status}</span></td>
      `;
      tableBody.appendChild(row);
    });
  }

  function getInitials(fullName) {
    return fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }
});
