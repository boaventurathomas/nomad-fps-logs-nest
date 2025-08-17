import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PlayersService } from './players.service'

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(private readonly service: PlayersService) { }

  @Get('ranking')
  async globalRanking() {
    return this.service.globalRanking()
  }
}
