import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Kill } from './kill.entity'
import { TeamAssignment } from './team-assignment.entity'

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index({ unique: true })
  @Column()
  name!: string

  @OneToMany(() => Kill, (k) => k.killer)
  kills!: Kill[]

  @OneToMany(() => Kill, (k) => k.victim)
  deaths!: Kill[]

  @OneToMany(() => TeamAssignment, (t) => t.player)
  teams!: TeamAssignment[]

  @CreateDateColumn()
  createdAt!: Date
}
