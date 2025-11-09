🚫 خطأ في الاتصال بالخادم.

Error: ./lib/enhancedTaskGenerator.js:1:1
[31m[1mModule not found[22m[39m: Can't resolve '[32m./notificationService[39m'
[0m[31m[1m>[22m[39m[90m 1 |[39m [36mimport[39m [33mNotificationService[39m [36mfrom[39m [32m'./notificationService'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m
 [90m 2 |[39m
 [90m 3 |[39m [90m// Note: All functions now require an active 'client' to be passed for transactional integrity.[39m
 [90m 4 |[39m[0m

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./pages/api/courses/create-with-tasks.js
    at tr (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:552:164430)
    at o6 (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:62116)
    at iP (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:81700)
    at i$ (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:92800)
    at sv (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:125399)
    at eval (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:125244)
    at sm (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:125252)
    at sa (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:121554)
    at sZ (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:143648)
    at MessagePort._ (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:196942)

     ○ Compiling /api/courses/create-with-tasks ...
 ⨯ ./lib/enhancedTaskGenerator.js:1:1
Module not found: Can't resolve './notificationService'
> 1 | import NotificationService from './notificationService';
    | ^
  2 |
  3 | // Note: All functions now require an active 'client' to be passed for transactional integrity.
  4 |

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./pages/api/courses/create-with-tasks.js
 ⨯ ./lib/enhancedTaskGenerator.js:1:1
Module not found: Can't resolve './notificationService'
> 1 | import NotificationService from './notificationService';
    | ^
  2 |
  3 | // Note: All functions now require an active 'client' to be passed for transactional integrity.
  4 |

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./pages/api/courses/create-with-tasks.js
 ⨯ ./lib/enhancedTaskGenerator.js:1:1
Module not found: Can't resolve './notificationService'
> 1 | import NotificationService from './notificationService';
    | ^
  2 |
  3 | // Note: All functions now require an active 'client' to be passed for transactional integrity.
  4 |

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./pages/api/courses/create-with-tasks.js
 POST /api/courses/create-with-tasks 500 in 2899ms
