# Workflow integration guide

This document describes how verification workflows are modeled for API consumers, orchestration engines, and partner systems. It aligns with the data structures in `src/types/workflow.ts` and the graph utilities in `src/lib/workflowGraph.ts`.

## Concepts

| Concept | Description |
|--------|-------------|
| **Workflow** | Versioned definition of a verification journey for an organization. |
| **Step** | A unit of work (`stepType`), optional tier profile, checks, and canvas `position`. |
| **`nodeId`** | Stable string identifier for a step across edits, saves, and integrations. Do not rely on `order` alone for idempotency. |
| **`order`** | Execution sequence derived from the directed acyclic graph (DAG) of steps. When no explicit `edges` are stored, steps are treated as a linear chain sorted by `order`. |
| **`edges`** | Optional array of `{ id, source, target }` where `source` and `target` are step `nodeId` values. Omit or leave empty for a simple linear flow. |
| **Virtual start** | The UI renders an “Entry” node that is not persisted. Entry edges are implied from steps with no incoming edge. |

## Step types

Built-in types are suited to the identity product:

- `document_upload`, `liveness_check`, `data_form`, `aml_screen`, `manual_review`

Extensibility hooks:

- **`webhook`** — Outbound or callback-style handoff. Use `integrationKey` (e.g. `crm.salesforce.session_complete`) and optional `metadata` for URLs, signing keys, or template IDs.
- **`custom`** — Arbitrary automation or third-party screen. Same `integrationKey` / `metadata` pattern.

Both support `label` for operator-facing copy.

## REST shape (reference)

The mock service in `src/services/workflowService.ts` mirrors a future HTTP API.

### Get workflow

`GET /v1/workflows/:id`

Response includes normalized `steps` (each with `nodeId`, `position`) and `edges` when defined; otherwise the client may infer a linear chain from `order`.

### Publish

`PUT /v1/workflows/:id/publish`

Published workflows are immutable; clone to draft for edits.

### Graph sync (draft only)

`PUT /v1/workflows/:id/graph`

Body:

```json
{
  "steps": [
    {
      "nodeId": "uuid-or-opaque-id",
      "order": 1,
      "stepType": "data_form",
      "tierProfileId": "TP-001",
      "required": true,
      "checks": ["email_verification"],
      "position": { "x": 120, "y": 200 },
      "label": "Optional label",
      "integrationKey": "partner.example.action",
      "metadata": { "timeoutMs": 8000 }
    }
  ],
  "edges": [
    { "id": "e-a-b", "source": "node-a", "target": "node-b" }
  ]
}
```

Rules enforced by `syncWorkflowGraph`:

- The step subgraph must be a **DAG** (no directed cycles).
- `order` is recomputed via a topological sort with deterministic tie-breaking (top-left `position` first) so parallel branches have a stable serialization.

### Add / remove step

- `POST /v1/workflows/:id/steps` — body matches `WorkflowStepCreate` (`nodeId` optional; assigned if omitted). Appends to the tail in the simple case; may add an edge from the previous tail when using linear defaults.
- `DELETE /v1/workflows/:id/steps/:nodeId` — removes the step and incident edges, then renormalizes `order` and repairs edges if needed.

## Execution semantics

1. Resolve **entry steps**: steps with no incoming edge in `edges` (or the first step in order when using an implicit line).
2. Walk the DAG in `order` for serialization, reporting, and “current step” UX; parallel branches share a total order only for display — your engine may run eligible branches concurrently if policy allows.
3. For `webhook` / `custom`, dispatch using `integrationKey` and `metadata`; treat failures according to `required` and tier settings.

## Frontend behavior

- The builder uses **React Flow** (`@xyflow/react`): pan, zoom, drag nodes, connect handles, delete selected **edges** with the Delete key. Steps are removed via the trash control on the node (not keyboard delete).
- **Drag-and-drop** from the “Drag block” chip applies the current palette configuration (type, checks, custom fields) at the drop position.
- Autosave debounces graph writes (~550 ms) after moves, edge changes, or new connections.

## Versioning

`workflow.version` increments on publish. Clients should send `workflowId` + `workflowVersion` when starting sessions so runs are pinned to a definition snapshot.
