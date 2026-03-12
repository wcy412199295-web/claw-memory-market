#!/bin/bash
# E2E test for Claw Memory Market API
set -e
API="http://localhost:3210/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IktyUnR6V080ZmRXdGxZQlFvdzFJXyIsInVzZXJuYW1lIjoibGV2aSIsImlhdCI6MTc3MzI5NTQyOSwiZXhwIjoxNzczOTAwMjI5fQ.UJ8kkpLLS29rdDuHP8N8eX_-niBUwAktJVD_XCbfw4s"
AUTH="Authorization: Bearer $TOKEN"

echo "=== 1. Deposit 200 USDT ==="
curl -s -X POST "$API/users/me/deposit" -H "$AUTH" -H "Content-Type: application/json" -d '{"amount":200}'
echo ""

echo "=== 2. Check balance ==="
curl -s "$API/users/me" -H "$AUTH"
echo ""

echo "=== 3. Purchase mem-001 ==="
curl -s -X POST "$API/listings/mem-001/purchase" -H "$AUTH"
echo ""

echo "=== 4. Post review ==="
curl -s -X POST "$API/listings/mem-001/reviews" -H "$AUTH" -H "Content-Type: application/json" -d '{"rating":5,"comment":"E2E test review"}'
echo ""

echo "=== 5. Detail with reviews ==="
curl -s "$API/listings/mem-001" | grep -c '"reviews"'
echo " reviews found"

echo "=== 6. Stats ==="
curl -s "$API/stats"
echo ""

echo "=== 7. Search '量化' ==="
curl -s "$API/listings?search=%E9%87%8F%E5%8C%96"
echo ""

echo "=== 8. My purchases ==="
curl -s "$API/listings/my/purchases" -H "$AUTH"
echo ""

echo "✅ E2E test complete!"
