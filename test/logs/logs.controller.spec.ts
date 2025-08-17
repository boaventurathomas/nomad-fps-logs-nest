import { Test, TestingModule } from '@nestjs/testing'
import { LogsController } from '../../src/logs/logs.controller'
import { LogsService } from '../../src/logs/logs.service'

describe('LogsController', () => {
  let controller: LogsController
  let service: LogsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogsController],
      providers: [
        {
          provide: LogsService,
          useValue: {
            // mock methods as needed
            getAll: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<LogsController>(LogsController)
    service = module.get<LogsService>(LogsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('upload', () => {
    it('should throw BadRequestException if file is not provided', async () => {
      await expect(controller.upload(undefined)).rejects.toThrow('Arquivo não enviado')
    })
    it('should call ingestFromRawText with file content', async () => {
      // Mock service
      (service as any).ingestFromRawText = jest.fn().mockResolvedValue({ ok: true })
      const file = { buffer: Buffer.from('log content', 'utf8') } as any
      const result = await controller.upload(file)
      expect((service as any).ingestFromRawText).toHaveBeenCalledWith('log content')
      expect(result).toEqual({ ok: true })
    })
  })

  describe('setTeams', () => {
    it('should call service.setTeams with params', async () => {
      (service as any).setTeams = jest.fn().mockResolvedValue({ ok: true })
      const result = await controller.setTeams('123', { Nick: 'A' })
      expect((service as any).setTeams).toHaveBeenCalledWith('123', { Nick: 'A' })
      expect(result).toEqual({ ok: true })
    })
  })
})
