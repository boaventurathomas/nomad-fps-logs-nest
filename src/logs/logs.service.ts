import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Kill } from '../domain/entities/kill.entity'
import { Match } from '../domain/entities/match.entity'
import { Player } from '../domain/entities/player.entity'
import { TeamAssignment } from '../domain/entities/team-assignment.entity'
import { Weapon } from '../domain/entities/weapon.entity'
import { parsePtDateTime } from '../shared/date.util'

type ParsedLine =
  | { type: 'start'; ts: Date; matchId: string }
  | { type: 'end'; ts: Date; matchId: string }
  | { type: 'kill'; ts: Date; killer: string | null; victim: string; weapon: string }

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
    @InjectRepository(Kill) private readonly killRepo: Repository<Kill>,
    @InjectRepository(Weapon) private readonly weaponRepo: Repository<Weapon>,
    @InjectRepository(TeamAssignment) private readonly teamRepo: Repository<TeamAssignment>
  ) { }

  private parseLine(line: string): ParsedLine | null {
    if (!line.trim()) {
      return null
    }

    const [left, right] = line.split(' - ')
    if (!left || !right) {
      return null
    }

    const ts = parsePtDateTime(left.trim())

    // New match
    const startMatch = right.match(/^New match (\d+) has started$/)
    if (startMatch) {
      return { type: 'start', ts, matchId: startMatch[1] }
    }

    // End match
    const endMatch = right.match(/^Match (\d+) has ended$/)
    if (endMatch) {
      return { type: 'end', ts, matchId: endMatch[1] }
    }

    // Kill lines
    // e.g., "Roman killed Nick using M16"
    const killUsing = right.match(/^(.+?) killed (.+?) using (.+)$/)
    if (killUsing) {
      const killer = killUsing[1].trim()
      const victim = killUsing[2].trim()
      const weapon = killUsing[3].trim()
      return { type: 'kill', ts, killer: killer === '<WORLD>' ? null : killer, victim, weapon }
    }

    // e.g., "<WORLD> killed Nick by DROWN"
    const killBy = right.match(/^(.+?) killed (.+?) by (.+)$/)
    if (killBy) {
      const killer = killBy[1].trim()
      const victim = killBy[2].trim()
      const weapon = killBy[3].trim()
      return { type: 'kill', ts, killer: killer === '<WORLD>' ? null : killer, victim, weapon }
    }

    return null
  }

  async ensurePlayer(name: string): Promise<Player> {
    let p = await this.playerRepo.findOne({ where: { name } })
    if (!p) {
      p = this.playerRepo.create({ name })
      await this.playerRepo.save(p)
    }
    return p
  }

  async ensureWeapon(name: string): Promise<Weapon> {
    let w = await this.weaponRepo.findOne({ where: { name } })
    if (!w) {
      w = this.weaponRepo.create({ name })
      await this.weaponRepo.save(w)
    }
    return w
  }

  async ingestFromRawText(text: string) {
    const lines = text.split(/\r?\n/)

    let currentMatchExtId: string | null = null
    let currentMatch: Match | null = null

    for (const raw of lines) {
      const parsed = this.parseLine(raw)
      if (!parsed) {
        continue
      }

      if (parsed.type === 'start') {
        currentMatchExtId = parsed.matchId
        let match = await this.matchRepo.findOne({ where: { externalId: parsed.matchId } })
        if (!match) {
          match = this.matchRepo.create({ externalId: parsed.matchId, startedAt: parsed.ts, endedAt: null })
          await this.matchRepo.save(match)
        } else if (!match.startedAt) {
          match.startedAt = parsed.ts
          await this.matchRepo.save(match)
        }
        currentMatch = match
      }

      if (parsed.type === 'kill') {
        if (!currentMatchExtId || !currentMatch) {
          continue
        }
        const weapon = await this.ensureWeapon(parsed.weapon)
        const victim = await this.ensurePlayer(parsed.victim)
        const killer = parsed.killer ? await this.ensurePlayer(parsed.killer) : null

        const kill = this.killRepo.create({
          match: currentMatch,
          killer,
          victim,
          weapon,
          occurredAt: parsed.ts,
          isWorld: !parsed.killer
        })

        // Friendly fire detection (if killer and victim share same team for this match)
        if (killer) {
          const teamK = await this.teamRepo.findOne({ where: { match: { id: currentMatch.id }, player: { id: killer.id } } })
          const teamV = await this.teamRepo.findOne({ where: { match: { id: currentMatch.id }, player: { id: victim.id } } })
          if (teamK && teamV && teamK.team === teamV.team) {
            kill.isFriendlyFire = true
          }
        }

        await this.killRepo.save(kill)
      }

      if (parsed.type === 'end') {
        const match = await this.matchRepo.findOne({ where: { externalId: parsed.matchId } })
        if (match) {
          match.endedAt = parsed.ts
          await this.matchRepo.save(match)
        }
        currentMatchExtId = null
        currentMatch = null
      }
    }

    return { ok: true }
  }

  async setTeams(externalId: string, mapping: Record<string, string>) {
    const match = await this.matchRepo.findOne({ where: { externalId } })
    if (!match) {
      throw new NotFoundException('Match não encontrado')
    }

    for (const [playerName, team] of Object.entries(mapping)) {
      const player = await this.ensurePlayer(playerName)
      let ta = await this.teamRepo.findOne({ where: { match: { id: match.id }, player: { id: player.id } } })

      if (!ta) {
        ta = this.teamRepo.create({ match, player, team })
      } else {
        ta.team = team
      }

      await this.teamRepo.save(ta)
    }

    return { ok: true }
  }
}
