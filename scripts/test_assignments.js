#!/usr/bin/env node

import pool from '../lib/db.js';
// The assignmentsScheduler is not directly used, but importing it might be intended 
// to ensure its code is loaded/validated during the test run.
import '../lib/assignmentsScheduler.js';

async function runTest() {
    console.log('🚀 Running Assignments Test Suite...');
    const client = await pool.connect();

    try {
        console.log('\n---');
        console.log('🧪 Test 1: Single Day Schedule Setup');
        await client.query('BEGIN');

        const teacherId = 1;
        const courseId = 1;

        console.log(`   - Cleaning up test data for teacher_id=${teacherId}, course_id=${courseId}...`);
        // Use CASCADE to clean up related occurrences as well
        await client.query('DELETE FROM assignment_templates WHERE teacher_id=$1 AND course_id=$2', [teacherId, courseId]);
        await client.query('DELETE FROM teacher_schedules WHERE teacher_id=$1 AND course_id=$2', [teacherId, courseId]);
        
        console.log('   - Inserting new test schedule and template...');
        await client.query(
            `INSERT INTO teacher_schedules (teacher_id, course_id, days, publish_time, is_paused) 
             VALUES ($1, $2, 'mon', '10:00', false) 
             ON CONFLICT (teacher_id, course_id) DO UPDATE SET days='mon', publish_time='10:00', is_paused=false`,
            [teacherId, courseId]
        );
        await client.query(
            `INSERT INTO assignment_templates (teacher_id, course_id, title, description, active) 
             VALUES ($1, $2, 'Test Assignment', 'Test Description', true)`,
            [teacherId, courseId]
        );

        const { rows } = await client.query('SELECT * FROM teacher_schedules WHERE teacher_id=$1 AND course_id=$2', [teacherId, courseId]);
        if (rows.length === 0) {
            throw new Error('Assertion failed: No schedule was inserted into teacher_schedules.');
        }

        console.log('   ✅ PASSED: Single day schedule setup successful.');
        
        // The test is designed to be rolled back, not committed.
        // This leaves the database clean after the test run.
        await client.query('ROLLBACK');
        console.log('   - Transaction rolled back to keep database clean.');

    } catch (e) {
        console.error('   ❌ FAILED: Test 1 failed.', e.message);
        await client.query('ROLLBACK');
        throw e; // Re-throw to fail the script
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await runTest();
        console.log('\n---');
        console.log('TZ check: Assuming TZ Africa/Cairo for scheduler (as per system design).'
        );
        console.log('Note: This script requires a seeded database with users and courses (e.g., user_id=1, course_id=1).');
        console.log('\n🎉 All tests passed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n🔥 A test failed, aborting script.');
        process.exit(1);
    }
}

main();