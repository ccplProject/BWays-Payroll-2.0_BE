import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('USRMSTUSERS')
export class USRMSTUSERS {
    @Column()
    COMPANY_ID: number;

    @PrimaryColumn()
    USER_ID: string;

    @Column()
    NAME: string;

    @Column()
    PASSWORD: string;

    @Column({ nullable: true })
    MODULE_NO: number;

    @Column({ nullable: true })
    DEPT_CODE: number;

    @Column({ nullable: true })
    DESG_CODE: number;

    @Column({ nullable: true })
    CELL_NO: string;

    @Column({ nullable: true })
    EMAIL_ID: string;

    @Column({ default: 0 })
    STATUS_CODE: number;
}

