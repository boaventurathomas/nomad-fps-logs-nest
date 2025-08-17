import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Kill } from '../domain/entities/kill.entity'
import { Match } from '../domain/entities/match.entity'
import { Player } from '../domain/entities/player.entity'
import { TeamAssignment } from '../domain/entities/team-assignment.entity'
import { Weapon } from '../domain/entities/weapon.entity'
import { LogsController } from './logs.controller'
import { LogsService } from './logs.service'

@Module({
  imports: [TypeOrmModule.forFeature([Match, Player, Kill, Weapon, TeamAssignment])],
  controllers: [LogsController],
  providers: [LogsService]
})
export class LogsModule { }
