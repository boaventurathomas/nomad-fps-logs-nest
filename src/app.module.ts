import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MulterModule } from '@nestjs/platform-express'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Kill } from './domain/entities/kill.entity'
import { Match } from './domain/entities/match.entity'
import { Player } from './domain/entities/player.entity'
import { TeamAssignment } from './domain/entities/team-assignment.entity'
import { Weapon } from './domain/entities/weapon.entity'

import { LogsModule } from './logs/logs.module'
import { MatchesModule } from './matches/matches.module'
import { PlayersModule } from './players/players.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule.register({}),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Match, Player, Kill, Weapon, TeamAssignment],
      synchronize: true
    }),
    LogsModule,
    MatchesModule,
    PlayersModule
  ]
})
export class AppModule { }
