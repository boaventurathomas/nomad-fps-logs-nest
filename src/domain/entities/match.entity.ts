import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Kill } from './kill.entity'
import { TeamAssignment } from './team-assignment.entity'

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  externalId!: string

  @Column({ type: 'datetime' })
  startedAt!: Date

  @Column({ type: 'datetime', nullable: true })
  endedAt!: Date | null

  @OneToMany(() => Kill, (k) => k.match, { cascade: true })
  kills!: Kill[]

  @OneToMany(() => TeamAssignment, (t) => t.match, { cascade: true })
  teams!: TeamAssignment[]

  @CreateDateColumn()
  createdAt!: Date
}
