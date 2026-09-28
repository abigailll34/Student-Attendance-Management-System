/**
 * app.js
 * ------
 * Code shared by every page:
 *  - highlighting the current page in the sidebar
 *  - a toast (success/error message) helper
 *  - a reusable confirm-dialog helper (used by "Delete student", etc.)
 *  - rendering the Dashboard page, when the dashboard's elements are present
 */

document.addEventListener("DOMContentLoaded", () => {
  highlightActiveNavLink();
  renderDashboardIfPresent();
  wireConfirmModal();
  wireMobileSidebarToggle();
});

/* ---------- Mobile sidebar toggle ---------- */

function wireMobileSidebarToggle() {
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const sidebar = document.getElementById("sidebar");
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("is-open");
  });

  // Close the sidebar again once a nav link is tapped on mobile.
  sidebar.querySelectorAll(".sidebar-nav a").forEach((link) => {
    link.addEventListener("click", () => sidebar.classList.remove("is-open"));
  });
}

/* ---------- Sidebar navigation ---------- */

function highlightActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".sidebar-nav a").forEach((link) => {
    const linkPage = link.getAttribute("href");
    link.classList.toggle("is-active", linkPage === currentPage);
  });
}

/* ---------- Toast messages ---------- */

/**
 * Shows a short message in the bottom-right corner of the screen.
 * type is "success" or "error", which controls the toast's color.
 */
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Remove the toast automatically after it has had time to be read.
  setTimeout(() => {
    toast.classList.add("toast--leaving");
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

/* ---------- Reusable confirm dialog ---------- */

let pendingConfirmAction = null;

/**
 * Opens the shared confirm modal with a custom message, and remembers
 * which function to run if the user clicks "Confirm".
 */
function askForConfirmation(message, onConfirm) {
  const modal = document.getElementById("confirm-modal");
  const messageEl = document.getElementById("confirm-modal-message");
  if (!modal || !messageEl) return;

  messageEl.textContent = message;
  pendingConfirmAction = onConfirm;
  modal.classList.add("is-open");
}

function wireConfirmModal() {
  const modal = document.getElementById("confirm-modal");
  if (!modal) return;

  const cancelBtn = document.getElementById("confirm-modal-cancel");
  const confirmBtn = document.getElementById("confirm-modal-confirm");

  cancelBtn.addEventListener("click", () => {
    modal.classList.remove("is-open");
    pendingConfirmAction = null;
  });

  confirmBtn.addEventListener("click", () => {
    if (typeof pendingConfirmAction === "function") {
      pendingConfirmAction();
    }
    modal.classList.remove("is-open");
    pendingConfirmAction = null;
  });

  // Clicking the dimmed background also cancels.
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("is-open");
      pendingConfirmAction = null;
    }
  });
}

/* ---------- Small shared utilities ---------- */

function formatDateForDisplay(isoDate) {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

/* ---------- Dashboard rendering ---------- */

function renderDashboardIfPresent() {
  const statsGrid = document.getElementById("dashboard-stats");
  if (!statsGrid) return; // Not on the dashboard page, nothing to do.

  const students = getStudents();
  const todaySummary = getTodayAttendanceSummary();
  const overallRate = getOverallAttendancePercentage();

  document.getElementById("stat-total-students").textContent = students.length;
  document.getElementById("stat-present-today").textContent = todaySummary.present;
  document.getElementById("stat-absent-today").textContent = todaySummary.absent;
  document.getElementById("stat-late-today").textContent = todaySummary.late;
  document.getElementById("stat-overall-rate").textContent = `${overallRate}%`;

  renderRecentAttendance(students);
}

function renderRecentAttendance(students) {
  const tableBody = document.getElementById("recent-attendance-body");
  const emptyState = document.getElementById("recent-attendance-empty");
  if (!tableBody) return;

  const studentsById = new Map(students.map((s) => [s.studentId, s]));

  const recentRecords = getAttendance()
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  tableBody.innerHTML = "";

  if (recentRecords.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  recentRecords.forEach((record) => {
    const student = studentsById.get(record.studentId);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student ? `<a href="student-details.html?id=${encodeURIComponent(student.id)}">${escapeHtml(student.fullName)}</a>` : "(removed student)"}</td>
      <td>${escapeHtml(record.studentId)}</td>
      <td>${formatDateForDisplay(record.date)}</td>
      <td>${escapeHtml(record.class)}</td>
      <td><span class="status-badge status-badge--${record.status.toLowerCase()}">${record.status}</span></td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Escapes text before inserting it into innerHTML, so a student's name
 * or class can never accidentally be interpreted as HTML.
 */
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
