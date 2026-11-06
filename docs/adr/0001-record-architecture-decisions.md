# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-05
- **Deciders:** Andy Moesch

## Context

xigo-web is built mostly by agents and reviewed by two people. Decisions made
in a conversation are lost when the conversation ends, and are argued again in
the next pull request.

## Decision

xigo-web keeps Architecture Decision Records in `docs/adr/`, in the shape every
xigo project uses (xigOS ADR 0001): one decision per file, numbered, never
renumbered, superseded rather than edited.

## Alternatives considered

- **Decisions in pull request descriptions** — they scroll away and cannot be
  cited by number.

## Consequences

- A major change carries a page written before the code.
- A reviewer can reject a change by citing an ADR.

## References

xigOS ADR 0001 and 0002.
