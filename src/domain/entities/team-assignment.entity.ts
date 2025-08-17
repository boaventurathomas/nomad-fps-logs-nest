import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Match } from './match.entity'
import { Player } from './player.entity'

@Entity()
@Unique(['match', 'player'])
export class TeamAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Match, (m) => m.teams, { eager: true })
  match!: Match

  @ManyToOne(() => Player, (p) => p.teams, { eager: true })
  player!: Player

  @Column()
  team!: string

  @CreateDateColumn()
  createdAt!: Date
}
