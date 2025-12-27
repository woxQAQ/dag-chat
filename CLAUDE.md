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

## AGENT_LOGGING Format

When logging completed features, use this compact format:

```markdown
### [FEATURE-ID] Feature Name - COMPLETED
**Branch:** feat/feature-branch
**Status:** Complete

#### Summary
- Key functionality (bullet points, 3-5 items)
- Main purpose and what it enables

#### Files
- `path/to/file.ts` (+test) - brief description
- `path/to/modified.ts` - what changed

#### Tests
- X new tests, all passing
```

**DO NOT include:**
- Detailed implementation details (constants, return values, line numbers, hex codes)
- Code examples or usage blocks
- Verbose component feature descriptions
- Visual design specifications (colors, sizes, spacing)
- "Next Steps" or "Important Notes" sections
- File structure diagrams

## Testing Guidelines
### Framework

Unit Testing: Vitest
Coverage: 80% minimum

### Commands
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Check coverage
```
### TDD Workflow

- **Write test first (should fail)**
- Write minimal code to pass
- Refactor if needed

### Rules

MUST write tests for new features
MUST write tests for bug fixes
MUST pass all tests before commit
Co-locate tests with source files: *.test.ts

### Test Structure
```ts
typescriptdescribe('FeatureName', () => {
  it('should do something when condition', () => {
    // Arrange
    const input = setupData();
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```
### Best Practices

- Test behavior, not implementation
- Keep tests simple and independent
- Mock external dependencies (APIs, databases)
- Test edge cases and errors
- Use descriptive test names (e.g., `shouldReturnErrorWhenInvalidInput`)

### Before Commit

- All tests pass
- Coverage meets 80%

## Git Conventions

- **Branch naming**: start with ["feat","chore","fix","ci","docs"] followed by a slash and the feature name
- **Commit messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) spec