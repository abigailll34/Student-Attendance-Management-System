/**
 * attendance.js
 * -------------
 * Powers attendance.html: pick a class and date, mark every student in
 * that class as Present, Absent or Late, then save it all to LocalStorage.
 */

document.addEventListener("DOMContentLoaded", () => {
  const classSelect = document.getElementById("attendance-class");
  if (!classSelect) return; // Guard: only run on attendance.html

  const dateInput = document.getElementById("attendance-date");
  const listContainer = document.getElementById("attendance-list");
  const emptyState = document.getElementById("attendance-empty-state");
  const saveBtn = document.getElementById("save-attendance-btn");
  const markAllPresentBtn = document.getElementById("mark-all-present-btn");
  const summaryEl = document.getElementById("attendance-summary");

  dateInput.value = todayIso();
  dateInput.max = todayIso();

  populateClassDropdown();
  renderAttendanceList();

  classSelect.addEventListener("change", renderAttendanceList);
  dateInput.addEventListener("change", renderAttendanceList);

  // Attached once here (rather than inside renderAttendanceList) so we
  // don't stack up duplicate listeners every time the list is redrawn.
  listContainer.addEventListener("change", updateSummary);

  markAllPresentBtn.addEventListener("click", () => {
    listContainer.querySelectorAll('input[value="Present"]').forEach((radio) => {
      radio.checked = true;
    });
    updateSummary();
  });

  saveBtn.addEventListener("click", saveAttendanceForClass);

  function populateClassDropdown() {
    const classes = getAllClasses();
    classSelect.innerHTML =
      '<option value="">Select a class</option>' +
      classes.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  }

  function renderAttendanceList() {
    const selectedClass = classSelect.value;
    const selectedDate = dateInput.value;
    listContainer.innerHTML = "";
    summaryEl.textContent = "";

    if (!selectedClass || !selectedDate) {
      emptyState.hidden = false;
      emptyState.textContent = "Choose a class and a date to see its students.";
      saveBtn.disabled = true;
      markAllPresentBtn.disabled = true;
      return;
    }

    const studentsInClass = getStudents().filter((student) => student.class === selectedClass);

    if (studentsInClass.length === 0) {
      emptyState.hidden = false;
      emptyState.textContent = `No students are enrolled in ${selectedClass} yet.`;
      saveBtn.disabled = true;
      markAllPresentBtn.disabled = true;
      return;
    }

    emptyState.hidden = true;
    saveBtn.disabled = false;
    markAllPresentBtn.disabled = false;

    // If attendance was already saved for this class/date, pre-fill the statuses.
    const existingRecords = getAttendanceForDate(selectedDate, selectedClass);
    const existingByStudentId = new Map(existingRecords.map((r) => [r.studentId, r.status]));

    studentsInClass.forEach((student) => {
      const currentStatus = existingByStudentId.get(student.studentId) || "";
      const row = document.createElement("div");
      row.className = "attendance-row";
      row.dataset.studentId = student.studentId;
      row.innerHTML = `
        <div class="attendance-row-name">
          <span class="attendance-row-fullname">${escapeHtml(student.fullName)}</span>
          <span class="attendance-row-id">${escapeHtml(student.studentId)}</span>
        </div>
        <div class="attendance-row-options" role="radiogroup" aria-label="Attendance status for ${escapeHtml(student.fullName)}">
          ${["Present", "Absent", "Late"]
            .map(
              (status) => `
            <label class="status-radio status-radio--${status.toLowerCase()}">
              <input type="radio" name="status-${student.studentId}" value="${status}" ${currentStatus === status ? "checked" : ""} />
              <span>${status}</span>
            </label>`
            )
            .join("")}
        </div>
      `;
      listContainer.appendChild(row);
    });

    updateSummary();
  }

  function updateSummary() {
    const total = listContainer.querySelectorAll(".attendance-row").length;
    const marked = listContainer.querySelectorAll('input[type="radio"]:checked').length;
    summaryEl.textContent = `${marked} of ${total} students marked`;
  }

  function saveAttendanceForClass() {
    const selectedClass = classSelect.value;
    const selectedDate = dateInput.value;
    const rows = listContainer.querySelectorAll(".attendance-row");

    // Validate: every student must have exactly one status selected.
    const unmarkedStudents = [];
    const results = [];

    rows.forEach((row) => {
      const studentId = row.dataset.studentId;
      const checkedRadio = row.querySelector('input[type="radio"]:checked');
      if (!checkedRadio) {
        unmarkedStudents.push(studentId);
      } else {
        results.push({ studentId, status: checkedRadio.value });
      }
    });

    if (unmarkedStudents.length > 0) {
      showToast(
        `Please mark a status for every student (${unmarkedStudents.length} remaining).`,
        "error"
      );
      return;
    }

    results.forEach((result) => {
      upsertAttendanceRecord({
        studentId: result.studentId,
        date: selectedDate,
        class: selectedClass,
        status: result.status,
      });
    });

    showToast(`Attendance saved for ${selectedClass} on ${formatDateForDisplay(selectedDate)}.`, "success");
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }
});
