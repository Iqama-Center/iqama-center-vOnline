#!/usr/bin/env node
// Migration script to standardize parent-child relationships
const pool = require('../lib/db');

async function migrateParentChildRelationships() {
    console.log('🔄 Starting Parent-Child Relationships Migration...\n');
    
    try {
        await pool.query('BEGIN');
        
        // Step 1: Ensure parent_child_relationships table has proper structure
        console.log('1. Updating parent_child_relationships table structure...');
        await pool.query(`
            ALTER TABLE parent_child_relationships 
            ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('✅ Table structure updated');
        
        // Step 2: Migrate existing JSONB parent_id references
        console.log('\n2. Migrating JSONB parent_id references...');
        const migrationResult = await pool.query(`
            INSERT INTO parent_child_relationships (parent_id, child_id, created_at)
            SELECT 
                (u.details->>'parent_id')::INTEGER as parent_id,
                u.id as child_id,
                u.created_at
            FROM users u
            WHERE u.details->>'parent_id' IS NOT NULL
                AND (u.details->>'parent_id')::INTEGER > 0
                AND u.role = 'student'
                AND NOT EXISTS (
                    SELECT 1 FROM parent_child_relationships pcr 
                    WHERE pcr.parent_id = (u.details->>'parent_id')::INTEGER 
                    AND pcr.child_id = u.id
                )
            RETURNING parent_id, child_id;
        `);
        
        console.log(`✅ Migrated ${migrationResult.rows.length} parent-child relationships`);
        
        // Step 3: Verify migration
        console.log('\n3. Verifying migration...');
        const totalRelationships = await pool.query('SELECT COUNT(*) as count FROM parent_child_relationships');
        const jsonbReferences = await pool.query(`
            SELECT COUNT(*) as count FROM users 
            WHERE details->>'parent_id' IS NOT NULL 
            AND (details->>'parent_id')::INTEGER > 0
            AND role = 'student'
        `);
        
        console.log(`Total relationships in table: ${totalRelationships.rows[0].count}`);
        console.log(`JSONB references found: ${jsonbReferences.rows[0].count}`);
        
        // Step 4: Clean up JSONB parent_id references (optional)
        console.log('\n4. Cleaning up JSONB parent_id references...');
        const cleanupResult = await pool.query(`
            UPDATE users 
            SET details = details - 'parent_id'
            WHERE details->>'parent_id' IS NOT NULL
            AND id IN (SELECT child_id FROM parent_child_relationships)
            RETURNING id;
        `);
        
        console.log(`✅ Cleaned up ${cleanupResult.rows.length} JSONB parent_id references`);
        
        // Step 5: Add indexes for performance
        console.log('\n5. Adding performance indexes...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_parent_child_parent ON parent_child_relationships(parent_id);
            CREATE INDEX IF NOT EXISTS idx_parent_child_child ON parent_child_relationships(child_id);
        `);
        console.log('✅ Indexes created');
        
        await pool.query('COMMIT');
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📊 Migration Summary:');
        console.log(`- Relationships migrated: ${migrationResult.rows.length}`);
        console.log(`- Total relationships: ${totalRelationships.rows[0].count}`);
        console.log(`- JSONB references cleaned: ${cleanupResult.rows.length}`);
        console.log('- Performance indexes: Added');
        
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    migrateParentChildRelationships()
        .then(() => {
            console.log('\n✅ Migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration script failed:', error.message);
            process.exit(1);
        });
}

module.exports = migrateParentChildRelationships;