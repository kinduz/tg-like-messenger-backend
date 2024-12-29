import { IsDate } from "class-validator";
import { BaseEntityWithIdAndDates } from "src/shared";
import { User } from "src/users/entities/user.entity";
import { Column, Entity,  JoinColumn,  OneToOne } from "typeorm";

@Entity()
export class OtpCode extends BaseEntityWithIdAndDates {
    @OneToOne(() => User, (user) => user.otp)
    @JoinColumn()
    user: User;

    @Column({nullable: false, length: 6})
    otp: string;

    @IsDate()
    @Column({nullable: false, type: 'timestamp'})
    expiresAt: Date;
}