Error: ./pages/dashboard.js
Error:   [31m×[0m Expected a semicolon
     ╭─[[36;1;4mE:\iqama-center-vOnline\iqama-center-vOnline\pages\dashboard.js[0m:155:1]
 [2m152[0m │         }
 [2m153[0m │ 
 [2m154[0m │         // Get public dashboard statistics for production
 [2m155[0m │         const statsResult = await getDashboardStats(null);
     · [35;1m        ▲[0m
 [2m156[0m │         
 [2m157[0m │         // Get recent public activities
 [2m157[0m │         const recentActivitiesResult = await pool.query(`
     ╰────
  [31m×[0m Expected ',', got 'catch'
     ╭─[[36;1;4mE:\iqama-center-vOnline\iqama-center-vOnline\pages\dashboard.js[0m:447:1]
 [2m444[0m │     }
 [2m445[0m │ 
 [2m446[0m │     return { props };
 [2m447[0m │     } catch (error) {
     · [35;1m      ─────[0m
 [2m448[0m │         console.error('Dashboard error:', error);
 [2m449[0m │         
 [2m449[0m │         // Fallback to static props with empty user data
     ╰────

Caused by:
    Syntax Error
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


     ⨯ ./pages/dashboard.js
Error:   × Expected a semicolon
     ╭─[E:\iqama-center-vOnline\iqama-center-vOnline\pages\dashboard.js:155:1]
 152 │         }
 153 │
 154 │         // Get public dashboard statistics for production
 155 │         const statsResult = await getDashboardStats(null);
     ·         ▲
 156 │
 157 │         // Get recent public activities
 157 │         const recentActivitiesResult = await pool.query(`
     ╰────
  × Expected ',', got 'catch'
     ╭─[E:\iqama-center-vOnline\iqama-center-vOnline\pages\dashboard.js:447:1]
 444 │     }
 445 │
 446 │     return { props };
 447 │     } catch (error) {
     ·       ─────
 448 │         console.error('Dashboard error:', error);
 449 │
 449 │         // Fallback to static props with empty user data
     ╰────

Caused by:
    Syntax Error
 ○ Compiling /dashboard ...
 ⨯ ./pages/dashboard.js
Error:   × Expected a semicolon
     ╭─[E:\iqama-center-vOnline\iqama-center-vOnline\pages\dashboard.js:155:1]
 152 │         }
 153 │
 154 │         // Get public dashboard statistics for production
 155 │         const statsResult = await getDashboardStats(null);
     ·         ▲
 156 │
 157 │         // Get recent public activities
 157 │         const recentActivitiesResult = await pool.query(`
     ╰────
  × Expected ',', got 'catch'
     ╭─[E:\iqama-center-vOnline\iqama-center-vOnline\pages\dashboard.js:447:1]
 444 │     }
 445 │
 446 │     return { props };
 447 │     } catch (error) {
     ·       ─────
 448 │         console.error('Dashboard error:', error);
 449 │
 449 │         // Fallback to static props with empty user data
     ╰────

Caused by:
    Syntax Error