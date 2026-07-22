#!/usr/bin/env bash
# Runs on every Codespace attach: pull latest code, sync DB schema, start dev.
# Seeding happens once in postCreateCommand, not here, to preserve data.
set -e

echo "▶ 최신 코드 받는 중..."
git pull --rebase --autostash || echo "(git pull 건너뜀)"

echo "▶ 의존성 확인..."
npm install

echo "▶ 데이터베이스 스키마 동기화..."
npx prisma generate
npx prisma db push

# DB가 비어 있으면(최초) 시드 데이터 삽입
if ! node -e "const{PrismaClient}=require('@prisma/client');new PrismaClient().user.count().then(n=>process.exit(n>0?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
  echo "▶ 시드 데이터 삽입..."
  npx tsx prisma/seed.ts || true
fi

echo "▶ 개발 서버 시작 (http://localhost:3000)"
npm run dev
