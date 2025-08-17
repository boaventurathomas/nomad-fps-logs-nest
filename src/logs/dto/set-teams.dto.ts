import { ApiProperty } from '@nestjs/swagger'
import { IsObject } from 'class-validator'

export class SetTeamsDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { Nick: 'A', Roman: 'B' }
  })
  @IsObject()
  teams: Record<string, string>
}
