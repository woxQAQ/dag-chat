# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MindFlow is a tree-structured AI chatbot that solves the context loss problem in complex conversations. Unlike traditional linear chat interfaces, conversations are stored as DAG/tree structures, allowing non-destructive branching and visual conversation topology.

## Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run Biome linter (read-only)
pnpm format       # Format code with Biome (writes to files)
pnpm check        # Run both lint and format with auto-fix
```

## Tech Stack

- **Next.js 16.1.1** with App Router
- **React 19.2.3** with React Compiler enabled
- **TypeScript** strict mode
- **Tailwind CSS v4** with PostCSS
- **Biome** for linting/formating (replaces ESLint + Prettier)
- **pnpm** as package manager

## Code Style

- **Indentation**: Tabs (configured in biome.json)
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Import organization**: Auto-organized on save via Biome

## Architecture

### Core Data Model (Adjacency List Pattern)

The conversation tree uses a recursive parent-child relationship:

```
Conversation -> MessageNode -> MessageNode (children)
                     |
                     v
                MessageNode (parent)
```

Key Prisma schema (from docs/architecture/ARCHITECTURE.md):

```prisma
model MessageNode {
  id             String       @id @default(uuid())
  conversationId String
  parentId       String?      // Adjacency list pattern
  role           Role         // system | user | assistant
  content        String       @db.Text

  parent         MessageNode? @relation("TreeStructure", fields: [parentId], references: [id])
  children       MessageNode[] @relation("TreeStructure")
}
```

### Key Architecture Decisions

- **ADR-001**: Full-stack Next.js for type safety from DB to UI
- **ADR-002**: Adjacency list with PostgreSQL `WITH RECURSIVE` for tree traversal
- **ADR-003**: Vercel AI SDK for streaming LLM responses

### Important Constraints

1. **Non-destructive editing**: Editing a message creates a new branch (fork), never overwrites
2. **Context-aware highlighting**: The UI must visually distinguish "active path" from "other branches"
3. **Tree queries**: Use `WITH RECURSIVE` CTE via Prisma's `$queryRaw` for full tree operations

## Project Structure

```
app/                      # Next.js App Router
src/                      # Shared components (currently empty, planned)
docs/
  ├── design/             # PRD, UI specs, low-fi prototypes
  └── architecture/       # Architecture decisions (ARCHITECTURE.md)
```

## Product Vision

Target users are developers, architects, and researchers who need to:
- Explore multiple solution branches without losing context
- Visually navigate conversation topology
- Switch between branches instantly (like a time machine)

See `docs/design/product_requirements_document.md` for detailed UX specifications.

## important hints

1. select a feature from `FEATURE_LIST` by their priority and dependencies.
2. record your working progress in `AGENT_LOGGING` in a log format
3. if you start a work on a feature, you should check `git log` and `AGENT_LOGGING` to get the insight of current project.
4. the `FEATURE_LIST` `state` field is in enum ["complete", "todo", "tested", "not tested"]. `FEATURE_LIST` is READONLY for you.
5. YOU SHOULD NOT DEVELOP AT main/master branch. you should create a new branch for each feature you work on. After you finish the feature, you need to commit your changes to the new branch.

## Git Conventions

- **Branch naming**: start with ["feat","chore","fix","ci","docs"] followed by a slash and the feature name
- **Commit messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) spec