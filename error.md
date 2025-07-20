Query attempt 1 failed: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
Waiting 10000ms for database auto-activation before retry...
Database query attempt 2/3
Query attempt 2 failed: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
Waiting 20000ms for database auto-activation before retry...
 ○ Compiling /login ...
 ✓ Compiled /login in 824ms (397 modules)
 ○ Compiling /api/auth/login ...
Database query attempt 3/3
 ✓ Compiled /api/auth/login in 965ms (205 modules)
Database query attempt 1/3
Query attempt 3 failed: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
Get public courses error: Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
    at async Object.queryWithRetry [as query] (lib\db.js:89:21)
    at async handler (pages\api\courses\public.js:10:23)
  87 |       console.log(`Database query attempt ${attempt}/${maxRetries}`);
  88 |
> 89 |       const client = await pool.connect();
     |                     ^
  90 |       try {
  91 |         const result = await client.query(text, params);
  92 |         console.log(`Query successful on attempt ${attempt}`);
 GET /api/courses/public 500 in 31653ms
Query attempt 1 failed: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
Waiting 10000ms for database auto-activation before retry...
 GET /login 200 in 417ms
Database query attempt 2/3
Query attempt 2 failed: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
Waiting 20000ms for database auto-activation before retry...