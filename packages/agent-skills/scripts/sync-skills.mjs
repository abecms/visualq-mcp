#!/usr/bin/env node
/**
 * Sync @visualq/agent-skills to a Cursor skills directory.
 * Usage: node scripts/sync-skills.mjs [targetDir]
 * Default target: ~/.cursor/skills
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skillsSrc = join(pkgRoot, 'skills')
const rulesSrc = join(pkgRoot, 'rules')
const targetArg = process.argv[2]
const cursorSkills = targetArg
  ? resolve(targetArg)
  : join(homedir(), '.cursor', 'skills')
const cursorRules = targetArg
  ? join(resolve(targetArg), '..', 'rules')
  : join(homedir(), '.cursor', 'rules')

mkdirSync(cursorSkills, { recursive: true })
mkdirSync(cursorRules, { recursive: true })

for (const name of readdirSync(skillsSrc)) {
  const src = join(skillsSrc, name)
  const dest = join(cursorSkills, name)
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true })
  cpSync(src, dest, { recursive: true })
  console.log(`Synced skill: ${name} → ${dest}`)
}

for (const name of readdirSync(rulesSrc)) {
  cpSync(join(rulesSrc, name), join(cursorRules, name))
  console.log(`Synced rule: ${name} → ${cursorRules}`)
}

console.log('Done.')
