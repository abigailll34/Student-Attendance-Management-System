# Student Attendance Management System

A browser-based application for teachers and school administrators to manage
students and record daily attendance. Built with plain HTML, CSS, and
JavaScript — no frameworks, no backend, no build step.

## How to run it

1. Download or clone this folder.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox).
3. That's it — there's nothing to install or configure. All data is saved
   in your browser's LocalStorage, so it will still be there the next time
   you open the app, even after closing the tab or restarting your computer.

> Tip: LocalStorage is tied to a specific browser on a specific computer.
> Opening the app in a different browser, or in "incognito/private" mode,
> will start with an empty dataset.

## Pages

| File                     | Purpose                                                          |
|--------------------------|-------------------------------------------------------------------|
| `index.html`             | Dashboard — totals, today's attendance, recent activity          |
| `students.html`          | Add, search, edit, and delete students                           |
| `attendance.html`        | Pick a class + date, mark Present/Absent/Late, save               |
| `history.html`           | Filter and browse every saved attendance record                  |
| `student-details.html`   | One student's profile and full attendance summary                |

## Project structure

```
student-attendance/
├── index.html
├── students.html
├── attendance.html
├── history.html
├── student-details.html
├── css/
│   └── style.css
├── js/
│   ├── storage.js          data layer (all LocalStorage reads/writes)
│   ├── app.js               shared UI: sidebar, toasts, confirm dialog, dashboard
│   ├── students.js          Students page logic
│   ├── attendance.js        Attendance page logic
│   ├── history.js           Attendance History page logic
│   └── student-details.js   Student Details page logic
└── assets/
    └── images/
```

## How data is stored

Two arrays live in LocalStorage:

- **`students`** — one object per student: `{ id, studentId, fullName, gender, age, class, phone }`
- **`attendance`** — one object per attendance record: `{ id, studentId, date, class, status }`

`storage.js` is the only file that reads or writes these keys directly.
Every other script calls its functions (`getStudents()`, `addStudent()`,
`upsertAttendanceRecord()`, etc.) instead of touching `localStorage` itself.
That keeps the data logic in one place and makes the rest of the code
easier to follow.

## Business rules enforced

1. Every Student ID must be unique.
2. A student can only have one attendance status per date — marking them
   again for the same day updates the existing record instead of creating
   a second one.
3. Every attendance record belongs to a real student.
4. Deleting a student also removes their attendance records, so history
   never shows orphaned data.
5. Attendance rate is calculated as `(Present Days / Total Days) × 100`.

## Known limitations

- Data is local to one browser on one device — there's no way to sync
  attendance across multiple computers without a real backend.
- There's no login system in this basic version (see "Possible next
  steps" below); anyone who opens the app has full access.
- Very large datasets (many thousands of records) may eventually slow
  LocalStorage down, since the whole array is re-saved on every write.

## Possible next steps

- Dark mode, pagination, and sorting on the Students table
- Export attendance to CSV, printable attendance reports, and charts
- A login screen with Teacher/Admin roles
