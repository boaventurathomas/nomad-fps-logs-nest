import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Kill } from '../../src/domain/entities/kill.entity'
import { Match } from '../../src/domain/entities/match.entity'
import { Player } from '../../src/domain/entities/player.entity'
import { MatchesService } from '../../src/matches/matches.service'

describe('MatchesService', () => {
  let service: MatchesService
  let matchRepo: any
  let playerRepo: any
  let killRepo: any

  beforeEach(async () => {
    matchRepo = { find: jest.fn(), findOne: jest.fn() }
    playerRepo = { find: jest.fn(), findOne: jest.fn() }
    killRepo = { find: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: getRepositoryToken(Match), useValue: matchRepo },
        { provide: getRepositoryToken(Player), useValue: playerRepo },
        { provide: getRepositoryToken(Kill), useValue: killRepo },
      ],
    }).compile()

    service = module.get<MatchesService>(MatchesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('listMatches', () => {
    it('should return matches in correct format', async () => {
      const matches = [
        { externalId: '1', startedAt: new Date('2023-01-01'), endedAt: null },
        { externalId: '2', startedAt: new Date('2023-01-02'), endedAt: new Date('2023-01-03') },
      ]
      matchRepo.find.mockResolvedValue(matches)
      const result = await service.listMatches()
      expect(result).toEqual([
        { externalId: '1', startedAt: matches[0].startedAt, endedAt: null },
        { externalId: '2', startedAt: matches[1].startedAt, endedAt: matches[1].endedAt },
      ])
      expect(matchRepo.find).toHaveBeenCalledWith({ order: { startedAt: 'ASC' } })
    })
  })

  describe('rankingForMatch', () => {
    it('should return null if match not found', async () => {
      matchRepo.findOne.mockResolvedValue(undefined)
      const result = await service.rankingForMatch('notfound')
      expect(result).toBeNull()
    })

    it('should return ranking for match', async () => {
      const match = { id: 1, externalId: '1', startedAt: new Date(), endedAt: new Date() }
      matchRepo.findOne.mockResolvedValue(match)
      const kill = {
        killer: { name: 'Nick' },
        victim: { name: 'Roman' },
        weapon: { name: 'M16' },
        occurredAt: new Date(),
        isWorld: false,
        isFriendlyFire: false,
      }
      killRepo.find.mockResolvedValue([kill])
      const result = await service.rankingForMatch('1')
      expect(result.match.externalId).toBe('1')
      expect(result.ranking.length).toBeGreaterThan(0)
    })

    it('should compute streak correctly', () => {
      const events = [
        { killer: 'A', victim: 'B', ts: new Date() },
        { killer: 'A', victim: 'C', ts: new Date() },
        { killer: 'A', victim: 'D', ts: new Date() },
        { killer: 'B', victim: 'A', ts: new Date() },
        { killer: 'A', victim: 'B', ts: new Date() },
      ]
      const result = (service as any).computeStreak(events, 'A')
      expect(result).toBe(3)
    })

    it('should set favoriteWeapon and NoDeathAward for winner', async () => {
      const match = { id: 1, externalId: '1', startedAt: new Date(), endedAt: new Date() }
      matchRepo.findOne.mockResolvedValue(match)
      const kill = {
        killer: { name: 'Nick' },
        victim: { name: 'Roman' },
        weapon: { name: 'M16' },
        occurredAt: new Date(),
        isWorld: false,
        isFriendlyFire: false,
      }
      killRepo.find.mockResolvedValue([kill])
      const result = await service.rankingForMatch('1')
      expect(result.ranking[0].favoriteWeapon).toBe('M16')
      expect(result.ranking[0].awards).toContain('NoDeathAward')
    })

    it('should handle friendly fire penalty and awards without speed award', async () => {
      const match = { id: 1, externalId: '1', startedAt: new Date(), endedAt: new Date() }
      matchRepo.findOne.mockResolvedValue(match)
      const now = new Date()
      const kills = [
        {
          killer: { name: 'Nick' },
          victim: { name: 'Roman' },
          weapon: { name: 'M16' },
          occurredAt: now,
          isWorld: false,
          isFriendlyFire: true,
        },
        {
          killer: { name: 'Nick' },
          victim: { name: 'Roman' },
          weapon: { name: 'M16' },
          occurredAt: new Date(now.getTime() + 1000),
          isWorld: false,
          isFriendlyFire: false,
        },
        {
          killer: { name: 'Nick' },
          victim: { name: 'Roman' },
          weapon: { name: 'M16' },
          occurredAt: new Date(now.getTime() + 2000),
          isWorld: false,
          isFriendlyFire: false,
        },
        {
          killer: { name: 'Nick' },
          victim: { name: 'Roman' },
          weapon: { name: 'M16' },
          occurredAt: new Date(now.getTime() + 3000),
          isWorld: false,
          isFriendlyFire: false,
        },
        {
          killer: { name: 'Nick' },
          victim: { name: 'Roman' },
          weapon: { name: 'M16' },
          occurredAt: new Date(now.getTime() + 64000),
          isWorld: false,
          isFriendlyFire: false,
        }
      ]
      killRepo.find.mockResolvedValue(kills)
      const result = await service.rankingForMatch('1')
      expect(result.ranking[0].awards).not.toContain('SpeedKillerAward')
      expect(result.ranking[0].favoriteWeapon).toBe('M16')
      expect(result.ranking[0].score).toBe(4) // 5 frags - 1 penalty
    })
  })

  it('should handle friendly fire penalty and awards', async () => {
    const match = { id: 1, externalId: '1', startedAt: new Date(), endedAt: new Date() }
    matchRepo.findOne.mockResolvedValue(match)
    const now = new Date()
    const kills = [
      {
        killer: { name: 'Nick' },
        victim: { name: 'Roman' },
        weapon: { name: 'M16' },
        occurredAt: now,
        isWorld: false,
        isFriendlyFire: true,
      },
      {
        killer: { name: 'Nick' },
        victim: { name: 'Roman' },
        weapon: { name: 'M16' },
        occurredAt: new Date(now.getTime() + 1000),
        isWorld: false,
        isFriendlyFire: false,
      },
      {
        killer: { name: 'Nick' },
        victim: { name: 'Roman' },
        weapon: { name: 'M16' },
        occurredAt: new Date(now.getTime() + 2000),
        isWorld: false,
        isFriendlyFire: false,
      },
      {
        killer: { name: 'Nick' },
        victim: { name: 'Roman' },
        weapon: { name: 'M16' },
        occurredAt: new Date(now.getTime() + 3000),
        isWorld: false,
        isFriendlyFire: false,
      },
      {
        killer: { name: 'Nick' },
        victim: { name: 'Roman' },
        weapon: { name: 'M16' },
        occurredAt: new Date(now.getTime() + 4000),
        isWorld: false,
        isFriendlyFire: false,
      }
    ]
    killRepo.find.mockResolvedValue(kills)
    const result = await service.rankingForMatch('1')
    expect(result.ranking[0].awards).toContain('SpeedKillerAward')
    expect(result.ranking[0].favoriteWeapon).toBe('M16')
    expect(result.ranking[0].score).toBe(4) // 5 frags - 1 penalty
  })
})
