import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { MatchesService } from './matches.service'

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly service: MatchesService) { }

  @Get()
  async list() {
    return this.service.listMatches()
  }

  @Get(':externalId/ranking')
  async ranking(@Param('externalId') externalId: string) {
    const res = await this.service.rankingForMatch(externalId)
    if (!res) throw new NotFoundException('Match não encontrado')
    return res
  }
}
