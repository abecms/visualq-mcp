import { describe, expect, it } from 'vitest'
import { manifestTools } from '../manifest.js'
import { toolsForProfile, TOOL_PROFILES } from '../profiles.js'

describe('toolsForProfile', () => {
  const all = manifestTools()

  it('qa profile includes run_full_audit and excludes legacy pillar runs', () => {
    const tools = toolsForProfile('qa', all)
    const names = new Set(tools.map((t) => t.name))
    expect(names.has('run_full_audit')).toBe(true)
    expect(names.has('create_frt_scenario')).toBe(true)
    expect(names.has('run_tracking')).toBe(false)
    expect(names.has('run_a11y')).toBe(false)
    expect(names.has('frt_save_feature_draft')).toBe(false)
  })

  it('legacy vrt-qa alias maps to qa toolset', () => {
    const legacy = toolsForProfile('vrt-qa', all)
    const qa = toolsForProfile('qa', all)
    expect(legacy.map(t => t.name).sort()).toEqual(qa.map(t => t.name).sort())
  })

  it('full profile returns all phase <= 3 manifest tools', () => {
    const tools = toolsForProfile('full', all)
    expect(tools.length).toBe(all.filter((t) => t.phase <= 3).length)
  })

  it('every qa profile tool name exists in manifest', () => {
    const manifestNames = new Set(all.map((t) => t.name))
    for (const name of TOOL_PROFILES.qa ?? []) {
      expect(manifestNames.has(name), `qa references missing tool ${name}`).toBe(true)
    }
  })
})
