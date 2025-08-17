import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Kill } from '../domain/entities/kill.entity'
import { Match } from '../domain/entities/match.entity'
import { Player } from '../domain/entities/player.entity'

type PlayerStats = {
  player: string
  frags: number
  deaths: number
  streak: number
  noDeathAward: boolean
  speedKillerAward: boolean
  favoriteWeapon?: string | null
  team?: string | null
  score: number // frags - friendlyFirePenalty
}

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
    @InjectRepository(Kill) private readonly killRepo: Repository<Kill>
  ) { }

  async listMatches() {
    const matches = await this.matchRepo.find({ order: { startedAt: 'ASC' } })
    return matches.map((m) => ({
      externalId: m.externalId,
      startedAt: m.startedAt,
      endedAt: m.endedAt
    }))
  }

  private computeStreak(events: { killer: string | null; victim: string; ts: Date }[], player: string): number {
    let best = 0
    let cur = 0
    for (const e of events) {
      if (e.killer === player) {
        cur += 1
        if (cur > best) best = cur
      }
      if (e.victim === player) {
        cur = 0 // died -> reset
      }
    }
    return best
  }

  private hasSpeedKiller(killTimes: Date[]): boolean {
    if (killTimes.length < 5) {
      return false
    }
    killTimes.sort((a, b) => a.getTime() - b.getTime())
    let i = 0
    for (let j = 0;j < killTimes.length;j++) {
      while (killTimes[j].getTime() - killTimes[i].getTime() > 60_000) {
        i++
      }
      if (j - i + 1 >= 5) {
        return true
      }
    }
    return false
  }

  async rankingForMatch(externalId: string) {
    const match = await this.matchRepo.findOne({ where: { externalId } })
    if (!match) return null

    const kills = await this.killRepo.find({ where: { match: { id: match.id } }, order: { occurredAt: 'ASC' } })
    const events = kills.map((k) => ({ killer: k.killer?.name ?? null, victim: k.victim.name, ts: k.occurredAt }))

    const playersSet = new Set<string>()
    for (const k of kills) {
      if (k.killer) playersSet.add(k.killer.name)
      playersSet.add(k.victim.name)
    }
    const players = Array.from(playersSet.values())

    const stats = new Map<string, PlayerStats>()
    for (const p of players) {
      stats.set(p, { player: p, frags: 0, deaths: 0, streak: 0, noDeathAward: false, speedKillerAward: false, favoriteWeapon: null, team: null, score: 0 })
    }

    // Aggregate
    const killsByPlayer: Record<string, { count: number; byWeapon: Record<string, number>; times: Date[]; ffPenalty: number }> = {}
    for (const p of players) killsByPlayer[p] = { count: 0, byWeapon: {}, times: [], ffPenalty: 0 }

    for (const k of kills) {
      const victimStats = stats.get(k.victim.name)!
      victimStats.deaths += 1

      if (k.killer && !k.isWorld) {
        const killerStats = stats.get(k.killer.name)!
        killerStats.frags += 1
        killsByPlayer[k.killer.name].count += 1
        killsByPlayer[k.killer.name].times.push(k.occurredAt)
        killsByPlayer[k.killer.name].byWeapon[k.weapon.name] = (killsByPlayer[k.killer.name].byWeapon[k.weapon.name] || 0) + 1

        if (k.isFriendlyFire) {
          // penalty: subtract 1 from score
          killsByPlayer[k.killer.name].ffPenalty += 1
        }
      }
    }

    // compute streaks & awards
    for (const p of players) {
      const st = stats.get(p)!
      st.streak = this.computeStreak(events, p)
      st.speedKillerAward = this.hasSpeedKiller(killsByPlayer[p].times)
      st.score = st.frags - killsByPlayer[p].ffPenalty
    }

    // favorite weapon of winner (by frags; tie-breaker score then name)
    const sorted = Array.from(stats.values()).sort((a, b) => {
      if (b.frags !== a.frags) {
        return b.frags - a.frags
      }
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return a.player.localeCompare(b.player)
    })

    const winner = sorted[0]
    if (winner) {
      const byW = killsByPlayer[winner.player].byWeapon
      const fav = Object.keys(byW).sort((a, b) => byW[b] - byW[a])[0]
      winner.favoriteWeapon = fav || null
      // NoDeathAward
      winner.noDeathAward = (stats.get(winner.player)?.deaths || 0) === 0
    }

    return {
      match: { externalId: match.externalId, startedAt: match.startedAt, endedAt: match.endedAt },
      ranking: sorted.map((s, i) => ({
        position: i + 1,
        player: s.player,
        frags: s.frags,
        deaths: s.deaths,
        score: s.score,
        streak: s.streak,
        favoriteWeapon: s.favoriteWeapon,
        awards: [
          ...(s.noDeathAward ? ['NoDeathAward'] : []),
          ...(s.speedKillerAward ? ['SpeedKillerAward'] : [])
        ]
      }))
    }
  }
}
