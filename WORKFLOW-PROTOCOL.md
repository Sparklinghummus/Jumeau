# Workflow Protocol

This document defines the canonical workflow contract Jumeau should use when Gemini builds workflows from the side panel.

Goal:

- keep the current UI unchanged
- persist enough structure to render workflows like `app-settings/src/app/components/pages/workflows-page.tsx`
- expose a minimal shell-like command surface for the agent
- keep visual fields derived by the renderer, not authored by Gemini

## Source Alignment

Current UI shape reference:

- `app-settings/src/app/components/workflow-canvas.tsx`
- `app-settings/src/app/components/detail-panel.tsx`
- `app-settings/src/app/components/pages/workflows-page.tsx`

Current live persistence and tool surface:

- `background.js`
- storage key: `liveCanvasState`
- current tools: `create_workflow`, `add_workflow_node`, `ask_workflow_question`

## Problem

The current sidepanel persistence is too weak to recreate the workflow editor faithfully.

Current node persistence in `background.js` only stores:

- `id`
- `type`
- `title`
- `description`
- `status`
- `rationale`
- `createdAt`

What the workflow editor actually needs to render correctly:

- canonical node type: `trigger | condition | action | branch`
- semantic category
- explicit graph links between nodes
- branch labels for branch nodes
- stable status values aligned with the UI
- type-specific configuration payload

Without those fields, Gemini can create a list of steps, but not a real workflow graph that resembles the editor page.

## Design Rules

1. Persistence is semantic, not visual.
2. Gemini must never author icon names, icon colors, or UI class names.
3. Renderer derives visuals from `type` and `category`.
4. The workflow is a graph, not just an ordered list.
5. Every node has a stable `id`.
6. Every edge is represented through `children`.
7. Only `branch` nodes may have more than one child.
8. Questions stay outside the graph in `questions[]`.

## Canonical Container

The persisted container should remain `liveCanvasState`.

```json
{
  "version": 2,
  "currentWorkflowId": "workflow_xxx",
  "workflows": [],
  "questions": [],
  "actions": [],
  "transcriptions": []
}
```

## Workflow Record

```json
{
  "id": "workflow_01",
  "title": "Voice Capture Pipeline",
  "goal": "Capture voice context and route it to the right destination",
  "trigger": "New voice memo received",
  "summary": "Transcribe, classify, branch, then write to the right store",
  "domain": "Jumeau",
  "status": "draft",
  "entryNodeId": "node_trigger_01",
  "createdAt": 1710000000000,
  "updatedAt": 1710000000000,
  "nodes": []
}
```

### Workflow Fields

Required:

- `id`
- `title`
- `goal`
- `status`
- `nodes`

Recommended:

- `trigger`
- `summary`
- `domain`
- `entryNodeId`
- `createdAt`
- `updatedAt`

### Workflow Status

Allowed values:

- `draft`
- `published`
- `archived`

## Node Record

Every node uses the same base shape.

```json
{
  "id": "node_xxx",
  "type": "action",
  "title": "Classify & enrich context",
  "category": "AI",
  "description": "Use AI to classify and enrich the voice context.",
  "status": "running",
  "children": ["node_branch_01"],
  "params": {},
  "createdAt": 1710000000000,
  "updatedAt": 1710000000000
}
```

### Common Node Fields

Required for all nodes:

- `id`
- `type`
- `title`
- `category`
- `description`

Optional for all nodes:

- `status`
- `children`
- `params`
- `createdAt`
- `updatedAt`

### Node Status

Allowed values:

- `pending`
- `running`
- `completed`

Do not persist `done`, `ready`, or `thinking` at node level.

Mapping from older values:

- `done` -> `completed`
- `thinking` -> `running`
- `ready` -> `pending`
- `draft` -> `pending`

## Supported Node Types

Only these four node types should be used if the target is the current workflow editor UI.

### 1. Trigger

Purpose:

- starts the workflow

Record:

```json
{
  "id": "node_trigger_01",
  "type": "trigger",
  "title": "Voice input received",
  "category": "Voice",
  "description": "Trigger when a new voice memo is captured.",
  "status": "completed",
  "children": ["node_condition_01"],
  "params": {
    "source": "voice",
    "event": "voice_input_received"
  }
}
```

Minimum required params:

- `source`
- `event`

### 2. Condition

Purpose:

- evaluates a single rule before continuing

Record:

```json
{
  "id": "node_condition_01",
  "type": "condition",
  "title": "Is type \"Skill\"?",
  "category": "Condition",
  "description": "Continue if the context type is \"Skill\".",
  "status": "completed",
  "children": ["node_action_01"],
  "params": {
    "expression": "context.type == \"Skill\"",
    "field": "context.type",
    "operator": "equals",
    "value": "Skill"
  }
}
```

Minimum required params:

- `expression`

Recommended params:

- `field`
- `operator`
- `value`

### 3. Action

Purpose:

- performs work or writes data

Record:

```json
{
  "id": "node_action_01",
  "type": "action",
  "title": "Classify & enrich context",
  "category": "AI",
  "description": "Use AI to classify and enrich the voice context.",
  "status": "running",
  "children": ["node_branch_01"],
  "params": {
    "operation": "classify_and_enrich",
    "provider": "gemini",
    "target": "context"
  }
}
```

Minimum required params:

- `operation`

Recommended params:

- `provider`
- `target`
- `integration`

### 4. Branch

Purpose:

- splits into multiple labeled paths

Record:

```json
{
  "id": "node_branch_01",
  "type": "branch",
  "title": "Route by category",
  "category": "Condition",
  "description": "Branch based on the classified category.",
  "status": "pending",
  "children": ["node_action_02", "node_action_03"],
  "params": {
    "mode": "label_match",
    "field": "classification.category"
  },
  "branchLabels": ["Technical skill", "Soft skill"]
}
```

Minimum required params:

- `mode`

Required extra fields for branch nodes:

- `children`
- `branchLabels`

Validation:

- `children.length >= 2`
- `branchLabels.length === children.length`

## Category Contract

`category` is required because the UI uses it for labeling and future icon mapping.

Current safe categories:

- `Voice`
- `Condition`
- `AI`
- `Records`
- `Lists`
- `Integrations`

For integration actions, `category` should stay semantic and broad, while the specific integration goes in `params.integration`.

Example:

```json
{
  "type": "action",
  "category": "Integrations",
  "params": {
    "operation": "send_message",
    "integration": "slack",
    "target": "#ops-alerts"
  }
}
```

## Visual Derivation Rules

Gemini does not persist visual fields.

Renderer derives them from the semantic contract:

- `trigger` -> trigger card styling and trigger icon
- `condition` -> condition styling
- `action` -> action styling
- `branch` -> branch styling

Suggested mapping for the current editor:

| Node type   | Default category | Default visual meaning |
| ----------- | ---------------- | ---------------------- |
| `trigger`   | `Voice`          | start node             |
| `condition` | `Condition`      | single rule            |
| `action`    | varies           | business step          |
| `branch`    | `Condition`      | route / split          |

For `action`, icon choice should be derived from `category` or `params.integration`.

## Canonical Shell Surface

This is the minimum protocol Gemini should target.

These commands are proposed as the stable workflow shell surface.

### `workflow.upsert`

Creates or updates a workflow container.

```sh
workflow.upsert \
  --workflow-id "workflow_01" \
  --title "Voice Capture Pipeline" \
  --goal "Capture voice context and route it correctly" \
  --trigger "New voice memo received" \
  --summary "Transcribe, classify, branch, write" \
  --domain "Jumeau" \
  --status "draft"
```

Required:

- `--title`
- `--goal`

Optional:

- `--workflow-id`
- `--trigger`
- `--summary`
- `--domain`
- `--status`

### `workflow.add_node`

Adds or updates a node inside a workflow.

```sh
workflow.add_node \
  --workflow-id "workflow_01" \
  --node-id "node_action_01" \
  --type "action" \
  --title "Classify & enrich context" \
  --category "AI" \
  --description "Use AI to classify and enrich the voice context." \
  --status "running" \
  --params '{"operation":"classify_and_enrich","provider":"gemini","target":"context"}'
```

Required:

- `--workflow-id`
- `--type`
- `--title`
- `--category`
- `--description`

Optional:

- `--node-id`
- `--status`
- `--params`

### `workflow.link_nodes`

Defines graph edges.

```sh
workflow.link_nodes \
  --workflow-id "workflow_01" \
  --from "node_trigger_01" \
  --to "node_condition_01"
```

Required:

- `--workflow-id`
- `--from`
- `--to`

Behavior:

- appends `to` into `from.children`
- deduplicates existing links

### `workflow.set_branch`

Defines labeled branch outputs for a branch node.

```sh
workflow.set_branch \
  --workflow-id "workflow_01" \
  --node-id "node_branch_01" \
  --branches '[{"label":"Technical skill","to":"node_action_02"},{"label":"Soft skill","to":"node_action_03"}]'
```

Required:

- `--workflow-id`
- `--node-id`
- `--branches`

Behavior:

- writes `children`
- writes `branchLabels`
- validates array length >= 2

### `workflow.set_entry`

Sets the entry node of the workflow.

```sh
workflow.set_entry \
  --workflow-id "workflow_01" \
  --node-id "node_trigger_01"
```

Required:

- `--workflow-id`
- `--node-id`

### `workflow.ask_question`

Stores ambiguity outside the graph.

```sh
workflow.ask_question \
  --workflow-id "workflow_01" \
  --question "What should happen when classification confidence is low?" \
  --context "The branch exists but the fallback path is undefined." \
  --suggested-answers '["Send to review","Retry classification","Create note only"]'
```

Required:

- `--question`

Optional:

- `--workflow-id`
- `--context`
- `--suggested-answers`

## Persisted Question Shape

```json
{
  "id": "question_01",
  "workflowId": "workflow_01",
  "text": "What should happen when classification confidence is low?",
  "context": "The fallback branch is missing.",
  "suggestedAnswers": ["Send to review", "Retry classification", "Create note only"],
  "createdAt": 1710000000000
}
```

## Full Example

This example matches the current editor mock in `workflow-canvas.tsx`.

```json
{
  "id": "workflow_voice_capture",
  "title": "Voice Capture Pipeline",
  "goal": "Capture voice input and route the resulting context",
  "trigger": "Voice input received",
  "summary": "Observe voice input, classify it, then route it to the right destination",
  "domain": "Jumeau",
  "status": "draft",
  "entryNodeId": "node_1",
  "createdAt": 1710000000000,
  "updatedAt": 1710000000000,
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger",
      "title": "Voice input received",
      "category": "Voice",
      "description": "Trigger when a new voice memo is captured.",
      "status": "completed",
      "children": ["node_2"],
      "params": {
        "source": "voice",
        "event": "voice_input_received"
      }
    },
    {
      "id": "node_2",
      "type": "condition",
      "title": "Is type \"Skill\"?",
      "category": "Condition",
      "description": "Continue if the context type is \"Skill\".",
      "status": "completed",
      "children": ["node_3"],
      "params": {
        "expression": "context.type == \"Skill\"",
        "field": "context.type",
        "operator": "equals",
        "value": "Skill"
      }
    },
    {
      "id": "node_3",
      "type": "action",
      "title": "Classify & enrich context",
      "category": "AI",
      "description": "Use AI to classify and enrich the voice context.",
      "status": "running",
      "children": ["node_4"],
      "params": {
        "operation": "classify_and_enrich",
        "provider": "gemini",
        "target": "context"
      }
    },
    {
      "id": "node_4",
      "type": "branch",
      "title": "Route by category",
      "category": "Condition",
      "description": "Branch based on the classified category.",
      "status": "pending",
      "children": ["node_5", "node_6"],
      "branchLabels": ["Technical skill", "Soft skill"],
      "params": {
        "mode": "label_match",
        "field": "classification.category"
      }
    },
    {
      "id": "node_5",
      "type": "action",
      "title": "Add to \"Technical\" tracker",
      "category": "Records",
      "description": "Add entry to \"Technical\" skill tracker.",
      "status": "pending",
      "children": [],
      "params": {
        "operation": "append_record",
        "target": "technical_tracker"
      }
    },
    {
      "id": "node_6",
      "type": "action",
      "title": "Add to \"Soft Skills\" list",
      "category": "Lists",
      "description": "Add entry to \"Soft Skills\" list.",
      "status": "pending",
      "children": [],
      "params": {
        "operation": "append_to_list",
        "target": "soft_skills_list"
      }
    }
  ]
}
```

## Validation Rules

Workflow-level:

- `title` must be non-empty
- `goal` must be non-empty
- `nodes` must contain unique `id` values
- `entryNodeId` should reference an existing node

Node-level:

- `type` must be one of `trigger | condition | action | branch`
- `title` must be non-empty
- `category` must be non-empty
- `description` must be non-empty
- `children` must only reference existing node ids
- non-branch nodes should have `children.length <= 1`
- branch nodes must have `children.length >= 2`
- branch nodes must provide `branchLabels`

## Compatibility With Current Implementation

Current tools in `background.js` are still useful, but they are v1 and under-specified.

### Current v1

- `create_workflow`
- `add_workflow_node`
- `ask_workflow_question`

### Missing in v1

- no `category`
- no `children`
- no `entryNodeId`
- no `branchLabels`
- no stable `params`
- node types are not aligned with the editor
- node statuses are not aligned with the editor

## Recommended Migration

1. Keep `liveCanvasState` as the storage root.
2. Add `version: 2`.
3. Upgrade node persistence to the schema above.
4. Keep old tools temporarily, but normalize them into the v2 schema.
5. Add explicit graph operations: `workflow.link_nodes`, `workflow.set_branch`, `workflow.set_entry`.
6. Let the renderer adapt persisted semantic data into the existing UI.

## Practical Rule For Gemini

If Gemini is building a workflow meant to resemble the current editor page:

- always create a workflow first
- always use one of the 4 canonical node types
- always provide `category`
- always provide `description`
- always connect nodes explicitly
- use `branch` only when there are 2 or more named outcomes
- store ambiguity in `questions[]`, not as fake workflow nodes
