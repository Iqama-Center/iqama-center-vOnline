#!/usr/bin/env node
import assignmentsScheduler from '../lib/assignmentsScheduler.js';

console.log('🚀 Starting Assignments Scheduler (مهام)...');
assignmentsScheduler.start();

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Assignments Scheduler...');
  process.exit(0);
});
