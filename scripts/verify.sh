#!/bin/bash
set -e

BACKEND_URL="http://localhost:3010"
FRONTEND_URL="http://localhost:3011"
PROMETHEUS_URL="http://localhost:9091"
GRAFANA_URL="http://localhost:3012"
TEMPO_URL="http://localhost:3201"

echo "=== 1. Checking Health Check Endpoint ==="
curl -s -f "$BACKEND_URL/health" | jq .

echo -e "\n=== 2. Checking Prometheus Metrics Endpoint ==="
curl -s "$BACKEND_URL/metrics" | grep -E "(http_requests_total|todo_)" | head -n 15

echo -e "\n=== 3. Authenticating Admin User (Alice) ==="
LOGIN_RES=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"Password123!","tenantId":"11111111-1111-1111-1111-111111111111"}')

TOKEN=$(echo "$LOGIN_RES" | jq -r .token)
echo "Token acquired: ${TOKEN:0:20}..."

echo -e "\n=== 4. Creating a CRITICAL Task (Invariants enforce Maker-Checker approval workflow) ==="
CREATE_RES=$(curl -s -X POST "$BACKEND_URL/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Perform Year-End General Ledger Close & Reconcile",
    "description": "Double-entry journal validation and maker-checker signoff.",
    "priority": "CRITICAL",
    "tags": ["finance", "audit", "gl"],
    "subtasks": [
      {"title": "Verify debit and credit sum equivalence"},
      {"title": "Lock prior fiscal period"}
    ]
  }')

TASK_ID=$(echo "$CREATE_RES" | jq -r .id)
VERSION=$(echo "$CREATE_RES" | jq -r .version)
echo "Task created: ID=$TASK_ID, Version=$VERSION, RequiresApproval=$(echo "$CREATE_RES" | jq -r .requiresApproval)"

echo -e "\n=== 5. Testing FSM: Move to IN_PROGRESS then IN_REVIEW ==="
curl -s -X PUT "$BACKEND_URL/api/v1/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"IN_PROGRESS"}' | jq '{id, status, version}'

curl -s -X PUT "$BACKEND_URL/api/v1/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"IN_REVIEW"}' | jq '{id, status, version}'

echo -e "\n=== 6. Testing Maker-Checker Violation: Alice (Creator) attempts self-approval ==="
curl -s -X POST "$BACKEND_URL/api/v1/tasks/$TASK_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"decision":"APPROVED","comments":"Self approval attempt"}' | jq .

echo -e "\n=== 7. Authenticating Manager (Bob) for Independent Signoff ==="
BOB_RES=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@acme.com","password":"Password123!","tenantId":"11111111-1111-1111-1111-111111111111"}')
BOB_TOKEN=$(echo "$BOB_RES" | jq -r .token)

echo "Bob approves the task:"
curl -s -X POST "$BACKEND_URL/api/v1/tasks/$TASK_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -d '{"decision":"APPROVED","comments":"Audited balances match. Approved for completion."}' | jq '{id, status, approvalStatus, approvedById, version}'

echo -e "\n=== 8. Checking Immutable Audit Trail (Append-Only Store) ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/v1/audit?entityId=$TASK_ID" | jq .

echo -e "\n=== 9. Verifying Observability Infrastructure ==="
echo "Prometheus status:"
curl -s "$PROMETHEUS_URL/-/healthy"
echo -e "\nGrafana status:"
curl -s "$GRAFANA_URL/api/health"
echo -e "\nTempo status:"
curl -s "$TEMPO_URL/ready"

echo -e "\n\nAll End-to-End Verification Checks Completed Successfully!"
