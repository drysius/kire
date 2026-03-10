# @kirejs/wire

`@kirejs/wire` adds server-driven components to Kire, inspired by Livewire style APIs.

## Purpose

- Stateful server components.
- Client-server action calls (`wire:click`, `wire:model`, etc.).
- Batching, streaming, events and component hydration.

## Core Concepts

- Server `Component` classes with state.
- `@wire("component")` to mount components in templates.
- Effects pipeline for redirect, events and stream updates.
- HTTP or socket transport adapters.

## Recent Runtime Improvements

- native `wire:navigate` route transitions
- cancellation of old requests when navigating
- progress bar during navigation
- session-expired recovery by refreshing current route via navigate

## Typical Use

Use when you want server logic to own state transitions while keeping frontend JS light.
