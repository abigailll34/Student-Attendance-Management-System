/**
 * history.js
 * ----------
 * Powers history.html: filters saved attendance records by date,
 * class, student and status.
 */

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("history-table-body");
  if (!tableBody) return; // Guard: only run on history.html

  const dateFilter = document.getElementById("filter-date");
  const classFilter = document.getElementById("filter-class");
  const studentFilter = document.getElementById("filter-student");
  const statusFilter = document.getElementById("filter-status");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");
  const emptyState = document.getElementById("history-empty-state");
  const resultCount = document.getElementById("history-result-count");

  const students = getStudents();
  const studentsByStudentId = new Map(students.map((s) => [s.studentId, s]));

  populateFilterOptions();
  renderHistoryTable();

  [dateFilter, classFilter, studentFilter, statusFilter].forEach((input) => {
    input.addEventListener("input", renderHistoryTable);
    input.addEventListener("change", renderHistoryTable);
  });

  clearFiltersBtn.addEventListener("click", () => {
    dateFilter.value = "";
    classFilter.value = "";
    studentFilter.value = "";
    statusFilter.value = "";
    renderHistoryTable();
  });

  function populateFilterOptions() {
    const classes = getAllClasses();
    classFilter.innerHTML =
      '<option value="">All classes</option>' +
      classes.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

    studentFilter.innerHTML =
      '<option value="">All students</option>' +
      students
        .map((s) => `<option value="${escapeHtml(s.studentId)}">${escapeHtml(s.fullName)} (${escapeHtml(s.studentId)})</option>`)
        .join("");
  }

  function renderHistoryTable() {
    const filters = {
      date: dateFilter.value,
      class: classFilter.value,
      studentId: studentFilter.value,
      status: statusFilter.value,
    };

    const filteredRecords = getAttendance()
      .filter((record) => !filters.date || record.date === filters.date)
      .filter((record) => !filters.class || record.class === filters.class)
      .filter((record) => !filters.studentId || record.studentId === filters.studentId)
      .filter((record) => !filters.status || record.status === filters.status)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    tableBody.innerHTML = "";
    resultCount.textContent = `${filteredRecords.length} record${filteredRecords.length === 1 ? "" : "s"}`;

    if (filteredRecords.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    filteredRecords.forEach((record) => {
      const student = studentsByStudentId.get(record.studentId);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${student ? `<a href="student-details.html?id=${encodeURIComponent(student.id)}">${escapeHtml(student.fullName)}</a>` : "(removed student)"}</td>
        <td>${escapeHtml(record.class)}</td>
        <td>${formatDateForDisplay(record.date)}</td>
        <td><span class="status-badge status-badge--${record.status.toLowerCase()}">${record.status}</span></td>
      `;
      tableBody.appendChild(row);
    });
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }
});
