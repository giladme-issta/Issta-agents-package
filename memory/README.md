# Memory System — README

This folder is managed exclusively by **Memory-Agent**.

## Purpose

Provides a persistent, searchable knowledge base of tasks performed by agents in this workspace. It enables agents to:

- Retrieve domain-specific insights before starting work (avoiding repeated mistakes)
- Record key discoveries, patterns, and tricks after completing work
- Track inter-agent collaboration history

## Folder Structure

```
memory/
  index.md          — master index, one row per task record
  README.md         — this file
  domains/          — aggregated living-document insights per project domain
  entries/          — individual task records (one file per task)
```

## How to Use

### Before starting a task

Invoke Memory-Agent in **RETRIEVE** mode:

```
@Memory-Agent RETRIEVE domain: hotels task: "fix CUG price mapping"
```

### After completing a task

Invoke Memory-Agent in **STORE** mode:

```
@Memory-Agent STORE
agents: [Hotel-Expert-V5]
domain: hotels
task: "Fixed CUG price mapping in GimmonixSupplierFullResults"
insights:
  - CUG prices are stored in a nested SpecialRates list, not the top-level Rate field
  - Must call .ResolveCugPrice() before passing to mapper or value is always 0
outcome: success
files: [ITS.Adapters.Products.Hotels/Mappers/HotelResultMapper.cs]
```

## Domain Files

Each `domains/<domain>.md` is a living document summarizing all reusable insights for that domain.
Memory-Agent appends new bullets after each STORE operation — it never overwrites existing content.
