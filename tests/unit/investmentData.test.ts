import { describe, expect, it } from 'vitest'
import {
  investmentProjects,
  getInvestmentById,
  addInvestmentProject,
  updateInvestmentProject,
  INVESTMENT_STAGES,
  INVESTMENT_SOURCES,
} from '@features/investments/investmentData'

describe('investment data', () => {
  it('has pre-seeded investment projects', () => {
    expect(investmentProjects.length).toBeGreaterThanOrEqual(7)
  })

  it('finds project by id', () => {
    const project = getInvestmentById('inv-001')
    expect(project).toBeDefined()
    expect(project?.title).toContain('масличных')
    expect(project?.sector).toBe('agro')
    expect(project?.regionCode).toBe('KZ-SEV')
  })

  it('returns undefined for non-existent project', () => {
    expect(getInvestmentById('nonexistent')).toBeUndefined()
  })

  it('adds a new investment project', () => {
    const before = investmentProjects.length

    const project = addInvestmentProject({
      title: 'Тестовый проект',
      description: 'Описание',
      sector: 'tech',
      regionCode: 'KZ-AST',
      volumeUsd: 10_000_000,
      stage: 'concept',
      source: 'private',
      initiator: 'Test Co',
      contactEmail: 'test@test.kz',
      documentIds: [],
      tags: ['тест'],
    })

    expect(project.id).toMatch(/^inv-/)
    expect(project.title).toBe('Тестовый проект')
    expect(project.createdAt).toBeDefined()
    expect(investmentProjects.length).toBe(before + 1)
  })

  it('updates an investment project', () => {
    const project = addInvestmentProject({
      title: 'Update Test',
      description: 'Before',
      sector: 'energy',
      regionCode: 'KZ-ALA',
      volumeUsd: 5_000_000,
      stage: 'feasibility',
      source: 'kazakh_invest',
      initiator: 'Update Co',
      contactEmail: 'update@test.kz',
      documentIds: [],
      tags: [],
    })

    const updated = updateInvestmentProject(project.id, {
      stage: 'construction',
      volumeUsd: 15_000_000,
      description: 'After update',
    })

    expect(updated?.stage).toBe('construction')
    expect(updated?.volumeUsd).toBe(15_000_000)
    expect(updated?.description).toBe('After update')
    expect(updated?.title).toBe('Update Test') // unchanged field
  })

  it('returns null for updating non-existent project', () => {
    expect(updateInvestmentProject('fake-id', { stage: 'operational' })).toBeNull()
  })

  it('has valid stage and source definitions', () => {
    expect(INVESTMENT_STAGES.length).toBe(5)
    expect(INVESTMENT_SOURCES.length).toBe(3)
    expect(INVESTMENT_STAGES.map((s) => s.id)).toContain('concept')
    expect(INVESTMENT_SOURCES.map((s) => s.id)).toContain('kazakh_invest')
  })
})
