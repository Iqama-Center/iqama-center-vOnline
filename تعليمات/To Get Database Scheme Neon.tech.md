انسخ السطرين في terminal:
$env:PGPASSWORD = "npg_s4JN2yCAYuep"
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" --host=ep-proud-cloud-a1ufwg7o-pooler.ap-southeast-1.aws.neon.tech --port=5432 --username=neondb_owner --dbname=neondb --schema-only --no-owner --no-privileges > schema.sql

