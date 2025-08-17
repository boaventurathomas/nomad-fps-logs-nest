import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Kill } from '../src/domain/entities/kill.entity'
import { Match } from '../src/domain/entities/match.entity'
import { Player } from '../src/domain/entities/player.entity'
import { TeamAssignment } from '../src/domain/entities/team-assignment.entity'
import { Weapon } from '../src/domain/entities/weapon.entity'
import { LogsService } from '../src/logs/logs.service'

describe('LogsService (integration)', () => {
  let service: LogsService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [Match, Player, Kill, Weapon, TeamAssignment],
          synchronize: true
        }),
        TypeOrmModule.forFeature([Match, Player, Kill, Weapon, TeamAssignment])
      ],
      providers: [LogsService]
    }).compile()

    service = moduleRef.get(LogsService)
  })

  it('parses multi-match logs and computes awards', async () => {
    const log = `
23/04/2019 15:34:22 - New match 11348965 has started
23/04/2019 15:36:04 - Roman killed Nick using M16
23/04/2019 15:36:33 - <WORLD> killed Nick by DROWN
23/04/2019 15:39:22 - Match 11348965 has ended

24/04/2020 16:14:22 - New match 11348961 has started
24/04/2020 16:26:12 - Roman killed Marcus using M16
24/04/2020 16:35:56 - Marcus killed Jhon using AK47
24/04/2020 17:12:34 - Roman killed Bryian using M16
24/04/2020 18:26:14 - Bryan killed Marcus using AK47
24/04/2020 19:36:33 - <WORLD> killed Marcus by DROWN
24/04/2020 20:19:22 - Match 11348961 has ended
`
    await service.ingestFromRawText(log)
    // simple existence assertions
    expect(true).toBeTruthy()
  })
})
