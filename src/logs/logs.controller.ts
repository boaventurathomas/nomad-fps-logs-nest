import { BadRequestException, Body, Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { LogsService } from './logs.service'

import { SetTeamsDto } from './dto/set-teams.dto'

@ApiTags('logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly service: LogsService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' }
      }
    }
  })

  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado')
    }
    const text = file.buffer.toString('utf8')
    return this.service.ingestFromRawText(text)
  }

  @Post('matches/:externalId/teams')
  async setTeams(
    @Param('externalId') externalId: string,
    @Body() dto: SetTeamsDto
  ) {
    return this.service.setTeams(externalId, dto.teams)
  }
}
