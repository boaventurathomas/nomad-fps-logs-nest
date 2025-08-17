import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { MatchesController } from '../../src/matches/matches.controller'
import { MatchesService } from '../../src/matches/matches.service'

describe('MatchesController', () => {
  let controller: MatchesController
  let service: MatchesService

  beforeEach(async () => {
    const serviceMock = {
      listMatches: jest.fn(),
      rankingForMatch: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [
        { provide: MatchesService, useValue: serviceMock },
      ],
    }).compile()
    controller = module.get<MatchesController>(MatchesController)
    service = module.get<MatchesService>(MatchesService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('list', () => {
    it('should return list of matches', async () => {
      const matches = [{ id: 1 }, { id: 2 }]
      service.listMatches = jest.fn().mockResolvedValue(matches)
      const result = await controller.list()
      expect(result).toBe(matches)
      expect(service.listMatches).toHaveBeenCalled()
    })
  })

  describe('ranking', () => {
    it('should return ranking for match', async () => {
      const ranking = [{ player: 'Nick', score: 10 }]
      service.rankingForMatch = jest.fn().mockResolvedValue(ranking)
      const result = await controller.ranking('123')
      expect(result).toBe(ranking)
      expect(service.rankingForMatch).toHaveBeenCalledWith('123')
    })
    it('should throw NotFoundException if match not found', async () => {
      service.rankingForMatch = jest.fn().mockResolvedValue(undefined)
      await expect(controller.ranking('notfound')).rejects.toThrow(NotFoundException)
    })
  })
})
