import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Kill } from '../../src/domain/entities/kill.entity'
import { Player } from '../../src/domain/entities/player.entity'
import { PlayersService } from '../../src/players/players.service'

describe('PlayersService', () => {
  let service: PlayersService
  let playerRepo: any
  let killRepo: any

  beforeEach(async () => {
    playerRepo = { find: jest.fn() }
    killRepo = { find: jest.fn() }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: getRepositoryToken(Player), useValue: playerRepo },
        { provide: getRepositoryToken(Kill), useValue: killRepo },
      ],
    }).compile()
    service = module.get<PlayersService>(PlayersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('globalRanking', () => {
    it('should return sorted ranking with correct scores', async () => {
      const players = [
        { id: 1, name: 'Nick' },
        { id: 2, name: 'Roman' },
      ]
      playerRepo.find.mockResolvedValue(players)
      // Nick: 3 kills (1 FF), 2 deaths; Roman: 1 kill (0 FF), 3 deaths
      killRepo.find
        .mockImplementationOnce(() => Promise.resolve([
          { isFriendlyFire: true },
          { isFriendlyFire: false },
          { isFriendlyFire: false },
        ])) // Nick kills
        .mockImplementationOnce(() => Promise.resolve([
          {}, {}
        ])) // Nick deaths
        .mockImplementationOnce(() => Promise.resolve([
          { isFriendlyFire: false },
        ])) // Roman kills
        .mockImplementationOnce(() => Promise.resolve([
          {}, {}, {}
        ])) // Roman deaths
      const result = await service.globalRanking()
      expect(result).toEqual([
        { position: 1, player: 'Nick', frags: 3, deaths: 2, score: 2 },
        { position: 2, player: 'Roman', frags: 1, deaths: 3, score: 1 },
      ])
    })
    it('should return empty array if no players', async () => {
      playerRepo.find.mockResolvedValue([])
      const result = await service.globalRanking()
      expect(result).toEqual([])
    })
    it('should sort by score, then frags, then name', async () => {
      const players = [
        { id: 1, name: 'B' },
        { id: 2, name: 'A' },
      ]
      playerRepo.find.mockResolvedValue(players)
      // Both: score 1, frags 2, deaths 0, so sort by name
      killRepo.find
        .mockImplementationOnce(() => Promise.resolve([{ isFriendlyFire: false }, { isFriendlyFire: false }])) // B kills
        .mockImplementationOnce(() => Promise.resolve([])) // B deaths
        .mockImplementationOnce(() => Promise.resolve([{ isFriendlyFire: false }, { isFriendlyFire: false }])) // A kills
        .mockImplementationOnce(() => Promise.resolve([])) // A deaths
      const result = await service.globalRanking()
      expect(result[0].player).toBe('A')
      expect(result[1].player).toBe('B')
    })
  })
})
