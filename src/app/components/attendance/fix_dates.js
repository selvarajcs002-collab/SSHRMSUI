const fs = require('fs');
const file = 'c:/Shaan PC/Projects/Employee Management System/EMS/ems-frontend/src/app/components/attendance/attendance.component.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "selectedDate = new Date().toISOString().substring(0, 10);", 
  "selectedDate = (function() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();"
);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed attendance dates');
