import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Match } from './match.entity'
import { Player } from './player.entity'
import { Weapon } from './weapon.entity'

@Entity()
export class Kill {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Match, (m) => m.kills, { eager: true })
  match!: Match

  @ManyToOne(() => Player, { eager: true, nullable: true })
  killer!: Player | null // null => WORLD

  @ManyToOne(() => Player, { eager: true })
  victim!: Player

  @ManyToOne(() => Weapon, { eager: true })
  weapon!: Weapon

  @Column({ type: 'datetime' })
  occurredAt!: Date

  @Column({ default: false })
  isWorld!: boolean

  @Column({ default: false })
  isFriendlyFire!: boolean

  @Index()
  @CreateDateColumn()
  createdAt!: Date
}
