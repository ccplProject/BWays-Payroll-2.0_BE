import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('CNFCOMPANY')
export class CNFCOMPANY {
    @PrimaryColumn()
    COMPANY_ID: number;

    @Column()
    SHORT_NAME: string;

    @Column()
    NAME: string;

    @Column({ nullable: true })
    ADDRESS1: string;

    @Column({ nullable: true })
    ADDRESS2: string;

    @Column({ nullable: true })
    CITY_NAME: string;

    @Column({ nullable: true })
    PINCODE: string;

    @Column({ nullable: true })
    PHONE_NO: string;

    @Column({ nullable: true })
    FAX: string;

    @Column({ nullable: true })
    WEBSITE: string;

    @Column({ nullable: true })
    EMAIL_ID: string;

    @Column({ nullable: true })
    CURRENCY: string;

    @Column({ nullable: true })
    SHORTDATE_FORMAT: string;

    @Column({ default: 0 })
    STATUS_CODE: number;
}

