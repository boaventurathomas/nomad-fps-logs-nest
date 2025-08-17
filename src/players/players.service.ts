import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Kill } from '../domain/entities/kill.entity'
import { Player } from '../domain/entities/player.entity'

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
    @InjectRepository(Kill) private readonly killRepo: Repository<Kill>
  ) { }

  async globalRanking() {
    const players = await this.playerRepo.find()
    const result = []

    for (const p of players) {
      const kills = await this.killRepo.find({ where: { killer: { id: p.id }, isWorld: false } })
      const deaths = await this.killRepo.find({ where: { victim: { id: p.id } } })
      const ff = kills.filter((k) => k.isFriendlyFire).length
      const frags = kills.length
      result.push({
        player: p.name,
        frags,
        deaths: deaths.length,
        score: frags - ff
      })
    }

    result.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }

      if (b.frags !== a.frags) {
        return b.frags - a.frags
      }

      return a.player.localeCompare(b.player)
    })

    return result.map((r, i) => ({ position: i + 1, ...r }))
  }
}
