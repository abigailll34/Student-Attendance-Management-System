/**
 * storage.js
 * ----------
 * All reading and writing to the browser's LocalStorage happens through
 * this file. Every other script calls these functions instead of touching
 * localStorage directly, so the storage keys and data shape only live
 * in one place.
 *
 * Data shape:
 *   students:   [{ id, studentId, fullName, gender, age, class, phone }]
 *   attendance: [{ id, studentId, date, class, status }]
 */

const STORAGE_KEYS = {
  STUDENTS: "students",
  ATTENDANCE: "attendance",
};

/* ---------- Low level helpers ---------- */

/**
 * Reads a key from LocalStorage and parses it as JSON.
 * If the key does not exist yet, or the saved data is corrupted,
 * this returns an empty array instead of throwing an error.
 */
function readFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Could not read "${key}" from LocalStorage. Resetting it.`, error);
    return [];
  }
}

/**
 * Saves an array to LocalStorage under the given key.
 * Returns true on success, false if saving failed (e.g. storage full).
 */
function writeToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Could not save "${key}" to LocalStorage.`, error);
    return false;
  }
}

/**
 * Generates a reasonably unique id for new records.
 * Combines the current time with a random suffix.
 */
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/* ---------- Student data access ---------- */

function getStudents() {
  return readFromStorage(STORAGE_KEYS.STUDENTS);
}

function saveStudents(students) {
  return writeToStorage(STORAGE_KEYS.STUDENTS, students);
}

function getStudentById(id) {
  return getStudents().find((student) => student.id === id) || null;
}

function findStudentByStudentId(studentId) {
  return getStudents().find(
    (student) => student.studentId.toLowerCase() === studentId.toLowerCase()
  );
}

function addStudent(studentData) {
  const students = getStudents();
  const newStudent = {
    id: generateId("stu"),
    studentId: studentData.studentId.trim(),
    fullName: studentData.fullName.trim(),
    gender: studentData.gender,
    age: Number(studentData.age),
    class: studentData.class,
    phone: studentData.phone ? studentData.phone.trim() : "",
  };
  students.push(newStudent);
  saveStudents(students);
  return newStudent;
}

function updateStudent(id, studentData) {
  const students = getStudents();
  const index = students.findIndex((student) => student.id === id);
  if (index === -1) return false;

  students[index] = {
    ...students[index],
    studentId: studentData.studentId.trim(),
    fullName: studentData.fullName.trim(),
    gender: studentData.gender,
    age: Number(studentData.age),
    class: studentData.class,
    phone: studentData.phone ? studentData.phone.trim() : "",
  };
  saveStudents(students);
  return true;
}

/**
 * Deletes a student and, per Business Rule 6, removes their attendance
 * records too so history never points at a student that no longer exists.
 */
function deleteStudent(id) {
  const student = getStudentById(id);
  if (!student) return false;

  const remainingStudents = getStudents().filter((s) => s.id !== id);
  saveStudents(remainingStudents);

  const remainingAttendance = getAttendance().filter(
    (record) => record.studentId !== student.studentId
  );
  saveAttendance(remainingAttendance);

  return true;
}

/* ---------- Attendance data access ---------- */

function getAttendance() {
  return readFromStorage(STORAGE_KEYS.ATTENDANCE);
}

function saveAttendance(records) {
  return writeToStorage(STORAGE_KEYS.ATTENDANCE, records);
}

/**
 * Records or updates attendance for one student on one date.
 * Enforces Business Rule 2 / 4: a student can only have one status
 * per date, so an existing record for that student + date is replaced
 * rather than duplicated.
 */
function upsertAttendanceRecord({ studentId, date, class: className, status }) {
  const records = getAttendance();
  const existingIndex = records.findIndex(
    (record) => record.studentId === studentId && record.date === date
  );

  if (existingIndex !== -1) {
    records[existingIndex].status = status;
    records[existingIndex].class = className;
  } else {
    records.push({
      id: generateId("att"),
      studentId,
      date,
      class: className,
      status,
    });
  }

  saveAttendance(records);
}

function getAttendanceForDate(date, className) {
  return getAttendance().filter(
    (record) => record.date === date && record.class === className
  );
}

function getAttendanceForStudent(studentId) {
  return getAttendance()
    .filter((record) => record.studentId === studentId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* ---------- Derived / calculated data ---------- */

/**
 * Returns the list of class names currently in use, derived from the
 * students table so the dropdowns always match real data.
 */
function getAllClasses() {
  const classes = getStudents().map((student) => student.class);
  return [...new Set(classes)].sort();
}

/**
 * Business Rule 5: Attendance Percentage = (Present Days / Total Days) * 100
 */
function calculateAttendanceRate(studentId) {
  const records = getAttendanceForStudent(studentId);
  if (records.length === 0) return 0;
  const presentDays = records.filter((r) => r.status === "Present").length;
  return Math.round((presentDays / records.length) * 100);
}

function getTodayAttendanceSummary() {
  const today = new Date().toISOString().split("T")[0];
  const todaysRecords = getAttendance().filter((record) => record.date === today);

  return {
    present: todaysRecords.filter((r) => r.status === "Present").length,
    absent: todaysRecords.filter((r) => r.status === "Absent").length,
    late: todaysRecords.filter((r) => r.status === "Late").length,
    totalMarked: todaysRecords.length,
  };
}

function getOverallAttendancePercentage() {
  const records = getAttendance();
  if (records.length === 0) return 0;
  const presentCount = records.filter((r) => r.status === "Present").length;
  return Math.round((presentCount / records.length) * 100);
}
