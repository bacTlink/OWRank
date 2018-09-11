./scripts/start_mysql.sh
./scripts/create_tables.sh
node --no-warnings ./auto_update.js > auto_update.log &
node --no-warnings server.js 80 443 > server.log &
/bin/bash
