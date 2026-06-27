import { describe, expect, it } from 'vitest'
import { manifestTools } from '../manifest.js'
import { toolsForProfile, TOOL_PROFILES } from '../profiles.js'

describe('toolsForProfile', () => {
  const all = manifestTools()

  it('vrt-qa excludes FRT-only tools', () => {
    const tools = toolsForProfile('vrt-qa', all)
    const names = new Set(tools.map((t) => t.name))
    expect(names.has('run_vrt')).toBe(true)
    expect(names.has('gate_pr_quality')).toBe(true)
    expect(names.has('run_frt_feature')).toBe(false)
    expect(names.has('frt_save_feature_draft')).toBe(false)
  })

  it('frt-qa excludes VRT run tools', () => {
    const tools = toolsForProfile('frt-qa', all)
    const names = new Set(tools.map((t) => t.name))
    expect(names.has('run_frt_feature')).toBe(true)
    expect(names.has('frt_propose_journey')).toBe(true)
    expect(names.has('run_vrt')).toBe(false)
  })

  it('tracking-qa focuses on tracking plan and audit', () => {
    const tools = toolsForProfile('tracking-qa', all)
    const names = new Set(tools.map((t) => t.name))
    expect(names.has('tracking_get_plan')).toBe(true)
    expect(names.has('run_tracking')).toBe(true)
    expect(names.has('run_vrt')).toBe(false)
  })

  it('full profile returns all phase <= 3 tools', () => {
    const tools = toolsForProfile('full', all)
    expect(tools.length).toBe(all.filter((t) => t.phase <= 3).length)
  })

  it('undefined profile returns all phase <= 3 tools', () => {
    const tools = toolsForProfile(undefined, all)
    expect(tools.length).toBe(all.filter((t) => t.phase <= 3).length)
  })

  it('every profile tool name exists in manifest', () => {
    const manifestNames = new Set(all.map((t) => t.name))
    for (const [profile, names] of Object.entries(TOOL_PROFILES)) {
      if (!names) continue
      for (const name of names) {
        expect(manifestNames.has(name), `${profile} references missing tool ${name}`).toBe(true)
      }
    }
  })
})
