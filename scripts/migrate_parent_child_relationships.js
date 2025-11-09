#!/usr/bin/env node
// Migration script to standardize parent-child relationships
const pool = require('../lib/db');

async function migrateParentChildRelationships() {
    console.log('🔄 Starting Parent-Child Relationships Migration...\n');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        // Step 1: Ensure parent_child_relationships table has proper structure
        console.log('1. Verifying parent_child_relationships table structure...');
        await client.query(`
            ALTER TABLE parent_child_relationships 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('✅ Table structure is up-to-date.');
        
        // Step 2: Migrate existing JSONB parent_id references
        console.log('\n2. Migrating JSONB parent_id references...');
        const migrationResult = await client.query(`
            INSERT INTO parent_child_relationships (parent_id, child_id, created_at)
            SELECT 
                (u.details->>'parent_id')::INTEGER as parent_id,
                u.id as child_id,
                u.created_at
            FROM users u
            WHERE u.details->>'parent_id' IS NOT NULL
                AND u.details->>'parent_id' ~ '^[0-9]+$' -- Ensure it is a valid integer
                AND (u.details->>'parent_id')::INTEGER > 0
                AND u.role = 'student'
            ON CONFLICT (parent_id, child_id) DO NOTHING
            RETURNING parent_id, child_id;
        `);
        
        if (migrationResult.rows.length > 0) {
            console.log(`✅ Migrated ${migrationResult.rows.length} new parent-child relationships.`);
        } else {
            console.log('✅ No new relationships to migrate.');
        }
        
        // Step 3: Verify migration
        console.log('\n3. Verifying migration...');
        const totalRelationships = await client.query('SELECT COUNT(*) as count FROM parent_child_relationships');
        const jsonbReferences = await client.query(`
            SELECT COUNT(*) as count FROM users 
            WHERE details->>'parent_id' IS NOT NULL
            AND details->>'parent_id' ~ '^[0-9]+$'
            AND (details->>'parent_id')::INTEGER > 0
            AND role = 'student'
        `);
        
        console.log(`Total relationships in table: ${totalRelationships.rows[0].count}`);
        console.log(`JSONB references found: ${jsonbReferences.rows[0].count}`);
        
        // Step 4: Clean up JSONB parent_id references
        console.log('\n4. Cleaning up migrated JSONB parent_id references...');
        const cleanupResult = await client.query(`
            UPDATE users u
            SET details = u.details - 'parent_id'
            WHERE u.details->>'parent_id' IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM parent_child_relationships pcr
                WHERE pcr.child_id = u.id AND pcr.parent_id = (u.details->>'parent_id')::INTEGER
            )
            RETURNING u.id;
        `);
        
        if (cleanupResult.rows.length > 0) {
            console.log(`✅ Cleaned up ${cleanupResult.rows.length} JSONB parent_id references.`);
        } else {
            console.log('✅ No JSONB references to clean up.');
        }
        
        // Step 5: Add indexes for performance
        console.log('\n5. Ensuring performance indexes exist...');
        await client.query(`CREATE INDEX IF NOT EXISTS idx_parent_child_parent ON parent_child_relationships(parent_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_parent_child_child ON parent_child_relationships(child_id);`);
        console.log('✅ Indexes are in place.');
        
        await client.query('COMMIT');
        
        console.log('\n🎉 Migration completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        client.release();
    }
}

// Run if called directly
if (require.main === module) {
    migrateParentChildRelationships()
        .then(() => {
            console.log('\n✅ Migration script finished.');
            pool.end(); // End pool after script finishes
        })
        .catch((error) => {
            console.error('\n❌ A fatal error occurred during migration.');
            pool.end();
            process.exit(1);
        });
}

module.exports = migrateParentChildRelationships;
