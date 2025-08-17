import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Kill } from '../domain/entities/kill.entity'
import { Match } from '../domain/entities/match.entity'
import { Player } from '../domain/entities/player.entity'
import { PlayersController } from './players.controller'
import { PlayersService } from './players.service'

@Module({
  imports: [TypeOrmModule.forFeature([Match, Player, Kill])],
  controllers: [PlayersController],
  providers: [PlayersService]
})
export class PlayersModule { }
