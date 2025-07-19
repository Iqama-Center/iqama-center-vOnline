npm run build

> iqama-center@1.0.0 build
> next build

   ▲ Next.js 15.4.1
   - Environments: .env.local, .env

 ✓ Linting and checking validity of types    
   Creating an optimized production build ...
Failed to compile.

./node_modules/pg-connection-string/index.js
Module not found: Can't resolve 'fs'

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./node_modules/pg/lib/connection-parameters.js
./node_modules/pg/lib/client.js
./node_modules/pg/lib/index.js
./node_modules/pg/esm/index.mjs
./lib/db.js
./pages/admin/courses/new.js

./node_modules/pg/lib/connection-parameters.js
Module not found: Can't resolve 'dns'

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./node_modules/pg/lib/client.js
./node_modules/pg/lib/index.js
./node_modules/pg/esm/index.mjs
./lib/db.js
./pages/admin/courses/new.js

./node_modules/pg/lib/connection.js
Module not found: Can't resolve 'net'

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./node_modules/pg/lib/index.js
./node_modules/pg/esm/index.mjs
./lib/db.js
./pages/admin/courses/new.js

./node_modules/pg/lib/stream.js
Module not found: Can't resolve 'net'

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./node_modules/pg/lib/connection.js
./node_modules/pg/lib/index.js
./node_modules/pg/esm/index.mjs
./lib/db.js
./pages/admin/courses/new.js

./node_modules/pg/lib/stream.js
Module not found: Can't resolve 'tls'

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./node_modules/pg/lib/connection.js
./node_modules/pg/lib/index.js
./node_modules/pg/esm/index.mjs
./lib/db.js
./pages/admin/courses/new.js


> Build failed because of webpack errors