#!/bin/sh
# 뮤런 app 컨테이너 entrypoint.
# 1) prisma migrate deploy 로 DB 스키마 동기화 (idempotent)
# 2) node server.js 로 Next 서버 기동

set -e

echo "[entrypoint] applying database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] starting Next.js..."
exec node server.js
