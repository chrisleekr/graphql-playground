# AGENTS.md: AI Collaboration Guide

This document provides essential guidelines for AI models interacting with this playground project. Following these standards ensures consistency, maintains code quality, and helps AI agents understand the project's architecture and deployment workflows.

## Project Overview

A monorepo multi-service project demonstrating:

- **AI Generation Scheduler**: Queue-based generation processing with real-time status updates
- **Durable Execution**: Using Inngest for reliable, step-based job processing
- **Full-Stack Application**: Next.js frontend + NestJS GraphQL API

## Tech Stack

- **Frontend**: Next.js 16+ with App Router, React 19
- **Backend**: NestJS with GraphQL (Apollo), NextAuth.js for authentication
- **Database**: PostgreSQL with Prisma ORM (Supabase-compatible)
- **Queue/Orchestration**: Inngest (durable execution with step functions)
- **Caching/State**: Redis via ioredis (local or Upstash)
- **Rate Limiting**: NestJS Throttler + custom Redis sliding window
- **Monorepo**: Turborepo with Bun package manager
- **Containerization**: Docker Compose for local development (PostgreSQL 16, Redis 7)
- **Deployment**: Vercel (frontend + API + workers)
- **Testing**: Vitest

Important: You must follow best practices for the tech stack and project architecture.

## Code Conventions

- Use TypeScript strict mode
- Follow existing file/folder structure
- Use Prisma for all database operations
- Keep shared types in `packages/shared`
- Use CSS Modules for component styles
- Follow NestJS module pattern for API

## AI Agent Guidelines

1. **Always use workspace packages**: Import from `@repo/database`, `@repo/shared`
2. **Check existing patterns**: Look at similar code before creating new
3. **Run type checks**: Use `bun run build` to verify changes
4. **Test locally**: Use `bun run dev` and `docker compose up -d`
5. **Environment variables**: Never commit secrets, use `.env.example` as template
