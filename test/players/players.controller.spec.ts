import { Test, TestingModule } from '@nestjs/testing'
import { PlayersController } from '../../src/players/players.controller'
import { PlayersService } from '../../src/players/players.service'

describe('PlayersController', () => {
  let controller: PlayersController
  let service: PlayersService

  beforeEach(async () => {
    const serviceMock = {
      globalRanking: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [
        { provide: PlayersService, useValue: serviceMock },
      ],
    }).compile()
    controller = module.get<PlayersController>(PlayersController)
    service = module.get<PlayersService>(PlayersService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('globalRanking', () => {
    it('should return global ranking', async () => {
      const ranking = [{ player: 'Nick', score: 10 }]
      service.globalRanking = jest.fn().mockResolvedValue(ranking)
      const result = await controller.globalRanking()
      expect(result).toBe(ranking)
      expect(service.globalRanking).toHaveBeenCalled()
    })
  })
})
