import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Kill } from '../../src/domain/entities/kill.entity'
import { Match } from '../../src/domain/entities/match.entity'
import { Player } from '../../src/domain/entities/player.entity'
import { TeamAssignment } from '../../src/domain/entities/team-assignment.entity'
import { Weapon } from '../../src/domain/entities/weapon.entity'
import { LogsService } from '../../src/logs/logs.service'

describe('LogsService', () => {
  let service: LogsService
  let matchRepo: any
  let playerRepo: any
  let killRepo: any
  let weaponRepo: any
  let teamRepo: any

  beforeEach(async () => {
    matchRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() }
    playerRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() }
    killRepo = { create: jest.fn(), save: jest.fn() }
    weaponRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() }
    teamRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogsService,
        { provide: getRepositoryToken(Match), useValue: matchRepo },
        { provide: getRepositoryToken(Player), useValue: playerRepo },
        { provide: getRepositoryToken(Kill), useValue: killRepo },
        { provide: getRepositoryToken(Weapon), useValue: weaponRepo },
        { provide: getRepositoryToken(TeamAssignment), useValue: teamRepo },
      ],
    }).compile()

    service = module.get<LogsService>(LogsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('ensurePlayer', () => {
    it('should return existing player', async () => {
      const player = { name: 'Nick' }
      playerRepo.findOne.mockResolvedValue(player)
      const result = await service.ensurePlayer('Nick')
      expect(result).toBe(player)
    })
    it('should create and return new player', async () => {
      playerRepo.findOne.mockResolvedValue(undefined)
      const player = { name: 'Nick' }
      playerRepo.create.mockReturnValue(player)
      playerRepo.save.mockResolvedValue(player)
      const result = await service.ensurePlayer('Nick')
      expect(playerRepo.create).toHaveBeenCalledWith({ name: 'Nick' })
      expect(playerRepo.save).toHaveBeenCalledWith(player)
      expect(result).toBe(player)
    })
  })

  describe('ensureWeapon', () => {
    it('should return existing weapon', async () => {
      const weapon = { name: 'M16' }
      weaponRepo.findOne.mockResolvedValue(weapon)
      const result = await service.ensureWeapon('M16')
      expect(result).toBe(weapon)
    })
    it('should create and return new weapon', async () => {
      weaponRepo.findOne.mockResolvedValue(undefined)
      const weapon = { name: 'M16' }
      weaponRepo.create.mockReturnValue(weapon)
      weaponRepo.save.mockResolvedValue(weapon)
      const result = await service.ensureWeapon('M16')
      expect(weaponRepo.create).toHaveBeenCalledWith({ name: 'M16' })
      expect(weaponRepo.save).toHaveBeenCalledWith(weapon)
      expect(result).toBe(weapon)
    })
  })

  describe('setTeams', () => {
    it('should throw if match not found', async () => {
      matchRepo.findOne.mockResolvedValue(undefined)
      await expect(service.setTeams('123', { Nick: 'A' })).rejects.toThrow(NotFoundException)
    })

    it('should set teams for players', async () => {
      const match = { id: 1, externalId: '123' }
      matchRepo.findOne.mockResolvedValue(match)
      playerRepo.findOne.mockResolvedValue({ id: 2, name: 'Nick' })
      teamRepo.findOne.mockResolvedValue(undefined)
      teamRepo.create.mockReturnValue({})
      teamRepo.save.mockResolvedValue({})
      const result = await service.setTeams('123', { Nick: 'A' })
      expect(result).toEqual({ ok: true })
    })

    it('should call setTeams with already created team', async () => {
      matchRepo.findOne.mockResolvedValueOnce({ externalId: '123', startedAt: new Date(), endedAt: null }) // start
      matchRepo.create.mockReturnValue({ externalId: '123', startedAt: new Date(), endedAt: null })
      matchRepo.save.mockResolvedValue({ id: 1, externalId: '123', startedAt: new Date(), endedAt: null })
      playerRepo.findOne.mockResolvedValue({ id: 2, name: 'Nick' })
      weaponRepo.findOne.mockResolvedValue({ id: 3, name: 'M16' })
      killRepo.create.mockReturnValue({})
      killRepo.save.mockResolvedValue({})
      teamRepo.findOne.mockResolvedValue({ id: 1, name: 'A' })

      await service.setTeams('123', { Nick: 'A' })
      expect(teamRepo.save).toHaveBeenCalled()
    })
  })

  describe('parseLine', () => {
    it('should return null for empty line', () => {
      // linha 33
      expect((service as any).parseLine('   ')).toBeNull()
    })
    it('should parse start match line', () => {
      const line = '16/08/2025 14:00:00 - New match 123 has started'
      const result = (service as any).parseLine(line)
      expect(result).toMatchObject({ type: 'start', matchId: '123' })
    })
    it('should parse end match line', () => {
      const line = '16/08/2025 15:00:00 - Match 123 has ended'
      const result = (service as any).parseLine(line)
      expect(result).toMatchObject({ type: 'end', matchId: '123' })
    })
    it('should parse kill using line', () => {
      const line = '16/08/2025 14:10:00 - Roman killed Nick using M16'
      const result = (service as any).parseLine(line)
      expect(result).toMatchObject({ type: 'kill', killer: 'Roman', victim: 'Nick', weapon: 'M16' })
    })
    it('should parse kill by line', () => {
      const line = '16/08/2025 14:11:00 - <WORLD> killed Nick by DROWN'
      const result = (service as any).parseLine(line)
      expect(result).toMatchObject({ type: 'kill', killer: null, victim: 'Nick', weapon: 'DROWN' })
    })

    it('should parse kill by line with without killer', () => {
      const line = '16/08/2025 14:12:00 - xxxx'
      const result = (service as any).parseLine(line)
      expect(result).toBeNull()
    })

    it('should return null for invalid line', () => {
      expect((service as any).parseLine('invalid line')).toBeNull()
    })
  })

  describe('ingestFromRawText', () => {
    it('should process start, kill, and end lines (linhas 108-110, 117, 137, 171)', async () => {
      // Mocks para garantir execução dos fluxos
      matchRepo.findOne.mockResolvedValueOnce(undefined) // start
      matchRepo.create.mockReturnValue({ externalId: '123', startedAt: new Date(), endedAt: null })
      matchRepo.save.mockResolvedValue({ id: 1, externalId: '123', startedAt: new Date(), endedAt: null })
      playerRepo.findOne.mockResolvedValue({ id: 2, name: 'Nick' })
      weaponRepo.findOne.mockResolvedValue({ id: 3, name: 'M16' })
      killRepo.create.mockReturnValue({})
      killRepo.save.mockResolvedValue({})
      teamRepo.findOne.mockResolvedValue(undefined)

      const text = [
        '16/08/2025 14:00:00 - New match 123 has started',
        '16/08/2025 14:10:00 - Roman killed Nick using M16',
        '16/08/2025 15:00:00 - Match 123 has ended',
      ].join('\n')
      const result = await service.ingestFromRawText(text)
      expect(result).toEqual({ ok: true })
      expect(matchRepo.create).toHaveBeenCalled() // linha 108
      expect(matchRepo.save).toHaveBeenCalled() // linha 110, 117, 137
      expect(killRepo.create).toHaveBeenCalled() // linha 137
      expect(killRepo.save).toHaveBeenCalled() // linha 171
    })
    it('should not process kill if no currentMatch', async () => {
      // kill line sem start
      const text = '16/08/2025 14:10:00 - Roman killed Nick using M16'
      // Não deve chamar create nem save
      const result = await service.ingestFromRawText(text)
      expect(result).toEqual({ ok: true })
      expect(killRepo.create).not.toHaveBeenCalled()
      expect(killRepo.save).not.toHaveBeenCalled()
    })

    it('should detect friendly fire and set isFriendlyFire', async () => {
      matchRepo.findOne.mockResolvedValueOnce(undefined) // start
      matchRepo.create.mockReturnValue({ externalId: '123', startedAt: new Date(), endedAt: null })
      matchRepo.save.mockResolvedValue({ id: 1, externalId: '123', startedAt: new Date(), endedAt: null })
      playerRepo.findOne.mockResolvedValue({ id: 2, name: 'Nick' })
      weaponRepo.findOne.mockResolvedValue({ id: 3, name: 'M16' })
      // Simula times iguais
      let isFF = false
      teamRepo.findOne.mockImplementation(({ where }) => {
        if (where.player.id === 2) return { team: 'A' }
        if (where.player.id === 1) return { team: 'A' }
        return undefined
      })

      killRepo.create.mockImplementation((obj) => {
        isFF = obj.isFriendlyFire === true
        return obj
      })

      killRepo.save.mockResolvedValue({})
      // currentMatch
      const text = [
        '16/08/2025 14:00:00 - New match 123 has started',
        '16/08/2025 14:10:00 - Roman killed Nick using M16',
        '16/08/2025 15:00:00 - Match 123 has ended',
      ].join('\n')
      await service.ingestFromRawText(text)
      expect(killRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isFriendlyFire: true }))
    })

    it('should update startedAt if match exists but startedAt is missing', async () => {
      // start com match existente sem startedAt
      matchRepo.findOne.mockResolvedValueOnce({ externalId: '123', startedAt: null })
      matchRepo.save.mockResolvedValue({ id: 1, externalId: '123', startedAt: new Date(), endedAt: null })
      const text = '16/08/2025 14:00:00 - New match 123 has started'
      await service.ingestFromRawText(text)
      expect(matchRepo.save).toHaveBeenCalled()
    })
    it('should update endedAt if match exists on end', async () => {
      matchRepo.findOne.mockResolvedValueOnce(undefined) // start
      matchRepo.create.mockReturnValue({ externalId: '123', startedAt: new Date(), endedAt: null })
      matchRepo.save.mockResolvedValue({ id: 1, externalId: '123', startedAt: new Date(), endedAt: null })
      // end
      matchRepo.findOne.mockResolvedValueOnce({ id: 1, externalId: '123', startedAt: new Date(), endedAt: null })
      const text = [
        '16/08/2025 14:00:00 - New match 123 has started',
        '16/08/2025 15:00:00 - Match 123 has ended',
      ].join('\n')
      await service.ingestFromRawText(text)
      expect(matchRepo.save).toHaveBeenCalled()
    })
    it('should skip lines that do not parse', async () => {
      const result = await service.ingestFromRawText('invalid line')
      expect(result).toEqual({ ok: true })
    })
  })
})
