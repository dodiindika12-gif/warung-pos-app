const fs = require('fs');
let code = fs.readFileSync('app/actions.ts', 'utf-8');

// Replace date('now') with date('now', '+8 hours')
code = code.replace(/date\('now'\)/g, "date('now', '+8 hours')");
// Replace date('now', '-7 days') with date('now', '+8 hours', '-7 days')
code = code.replace(/date\('now', '-7 days'\)/g, "date('now', '+8 hours', '-7 days')");

// Replace date(created_at) with date(created_at, '+8 hours')
code = code.replace(/date\(created_at\)/g, "date(created_at, '+8 hours')");
code = code.replace(/date\(t\.created_at\)/g, "date(t.created_at, '+8 hours')");

// Replace strftime('%Y-%m', t.created_at) with strftime('%Y-%m', t.created_at, '+8 hours')
code = code.replace(/strftime\('%Y-%m', t\.created_at\)/g, "strftime('%Y-%m', t.created_at, '+8 hours')");

// Add 'Z' to created_at when returning rows in getProducts, getHistory, getLaporan, etc.
// Actually, it's safer to just replace new Date(item.created_at) with new Date(item.created_at + 'Z') in all tsx files.

fs.writeFileSync('app/actions.ts', code);
console.log('actions.ts updated');
