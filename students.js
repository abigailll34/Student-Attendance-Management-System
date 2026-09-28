/**
 * students.js
 * -----------
 * Powers students.html: listing, searching, adding, editing and
 * deleting students. Uses the functions from storage.js to persist
 * everything to LocalStorage.
 */

document.addEventListener("DOMContentLoaded", () => {
  const studentsTableBody = document.getElementById("students-table-body");
  if (!studentsTableBody) return; // Guard: only run this file on students.html

  const searchInput = document.getElementById("student-search");
  const emptyState = document.getElementById("students-empty-state");
  const modal = document.getElementById("student-modal");
  const form = document.getElementById("student-form");
  const modalTitle = document.getElementById("student-modal-title");
  const addStudentBtn = document.getElementById("add-student-btn");
  const cancelModalBtn = document.getElementById("student-modal-cancel");

  // Which student is currently being edited (null means "adding new").
  let editingStudentId = null;

  renderStudentsTable(getStudents());
  populateClassDatalist();

  /* ---------- Search (filters as the user types) ---------- */
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = getStudents().filter(
      (student) =>
        student.studentId.toLowerCase().includes(term) ||
        student.fullName.toLowerCase().includes(term) ||
        student.class.toLowerCase().includes(term)
    );
    renderStudentsTable(filtered, term);
  });

  /* ---------- Open modal: Add ---------- */
  addStudentBtn.addEventListener("click", () => {
    editingStudentId = null;
    modalTitle.textContent = "Add Student";
    form.reset();
    clearFormErrors();
    modal.classList.add("is-open");
    document.getElementById("field-studentId").focus();
  });

  /* ---------- Close modal ---------- */
  cancelModalBtn.addEventListener("click", closeStudentModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeStudentModal();
  });

  function closeStudentModal() {
    modal.classList.remove("is-open");
    editingStudentId = null;
    form.reset();
    clearFormErrors();
  }

  /* ---------- Table actions: Edit / Delete (event delegation) ---------- */
  studentsTableBody.addEventListener("click", (event) => {
    const editBtn = event.target.closest("[data-edit-id]");
    const deleteBtn = event.target.closest("[data-delete-id]");

    if (editBtn) {
      openEditModal(editBtn.dataset.editId);
    }
    if (deleteBtn) {
      const student = getStudentById(deleteBtn.dataset.deleteId);
      if (!student) return;
      askForConfirmation(
        `Delete ${student.fullName} (${student.studentId})? Their attendance records will be removed too.`,
        () => {
          deleteStudent(student.id);
          renderStudentsTable(getStudents(), searchInput.value.trim().toLowerCase());
          populateClassDatalist();
          showToast(`${student.fullName} was deleted.`, "success");
        }
      );
    }
  });

  function openEditModal(id) {
    const student = getStudentById(id);
    if (!student) return;

    editingStudentId = id;
    modalTitle.textContent = "Edit Student";
    clearFormErrors();

    document.getElementById("field-studentId").value = student.studentId;
    document.getElementById("field-fullName").value = student.fullName;
    document.getElementById("field-gender").value = student.gender;
    document.getElementById("field-age").value = student.age;
    document.getElementById("field-class").value = student.class;
    document.getElementById("field-phone").value = student.phone || "";

    modal.classList.add("is-open");
  }

  /* ---------- Form submit: Add or Update ---------- */
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = {
      studentId: document.getElementById("field-studentId").value.trim(),
      fullName: document.getElementById("field-fullName").value.trim(),
      gender: document.getElementById("field-gender").value,
      age: document.getElementById("field-age").value.trim(),
      class: document.getElementById("field-class").value.trim(),
      phone: document.getElementById("field-phone").value.trim(),
    };

    const errors = validateStudentForm(formData, editingStudentId);
    if (Object.keys(errors).length > 0) {
      showFormErrors(errors);
      return;
    }

    if (editingStudentId) {
      updateStudent(editingStudentId, formData);
      showToast("Student details updated.", "success");
    } else {
      addStudent(formData);
      showToast("Student added successfully.", "success");
    }

    closeStudentModal();
    renderStudentsTable(getStudents(), searchInput.value.trim().toLowerCase());
    populateClassDatalist();
  });

  /* ---------- Validation ---------- */

  function validateStudentForm(data, currentlyEditingId) {
    const errors = {};

    if (!data.studentId) errors.studentId = "Student ID is required.";
    if (!data.fullName) errors.fullName = "Full name is required.";
    if (!data.gender) errors.gender = "Please select a gender.";
    if (!data.class) errors.class = "Class is required.";

    if (!data.age) {
      errors.age = "Age is required.";
    } else if (!Number.isInteger(Number(data.age)) || Number(data.age) < 3 || Number(data.age) > 100) {
      errors.age = "Enter a valid age between 3 and 100.";
    }

    if (data.phone && !/^[0-9+\-\s()]{7,15}$/.test(data.phone)) {
      errors.phone = "Enter a valid phone number, or leave it blank.";
    }

    if (data.studentId) {
      const existing = findStudentByStudentId(data.studentId);
      const isDuplicate = existing && existing.id !== currentlyEditingId;
      if (isDuplicate) {
        errors.studentId = "This Student ID is already in use.";
      }
    }

    return errors;
  }

  function showFormErrors(errors) {
    clearFormErrors();
    Object.entries(errors).forEach(([field, message]) => {
      const errorEl = document.getElementById(`error-${field}`);
      const inputEl = document.getElementById(`field-${field}`);
      if (errorEl) errorEl.textContent = message;
      if (inputEl) inputEl.classList.add("input-invalid");
    });
  }

  function clearFormErrors() {
    form.querySelectorAll(".form-error").forEach((el) => (el.textContent = ""));
    form.querySelectorAll(".input-invalid").forEach((el) => el.classList.remove("input-invalid"));
  }

  /* ---------- Rendering ---------- */

  function renderStudentsTable(students, searchTerm = "") {
    studentsTableBody.innerHTML = "";

    if (students.length === 0) {
      emptyState.hidden = false;
      emptyState.textContent = searchTerm
        ? `No students match "${searchTerm}".`
        : "No students yet. Click \u201cAdd Student\u201d to create the first record.";
      return;
    }
    emptyState.hidden = true;

    students.forEach((student) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(student.studentId)}</td>
        <td><a href="student-details.html?id=${encodeURIComponent(student.id)}">${escapeHtml(student.fullName)}</a></td>
        <td>${escapeHtml(student.gender)}</td>
        <td>${escapeHtml(student.class)}</td>
        <td>${student.age}</td>
        <td class="table-actions">
          <button class="icon-btn" data-edit-id="${student.id}" title="Edit ${escapeHtml(student.fullName)}" aria-label="Edit student">✎</button>
          <button class="icon-btn icon-btn--danger" data-delete-id="${student.id}" title="Delete ${escapeHtml(student.fullName)}" aria-label="Delete student">🗑</button>
        </td>
      `;
      studentsTableBody.appendChild(row);
    });
  }

  function populateClassDatalist() {
    const datalist = document.getElementById("class-options");
    if (!datalist) return;
    const classes = getAllClasses();
    datalist.innerHTML = classes.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("");
  }
});
