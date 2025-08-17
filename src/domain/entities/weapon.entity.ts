import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Kill } from './kill.entity'

@Entity()
export class Weapon {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index({ unique: true })
  @Column()
  name!: string

  @OneToMany(() => Kill, (k) => k.weapon)
  kills!: Kill[]

  @CreateDateColumn()
  createdAt!: Date
}
