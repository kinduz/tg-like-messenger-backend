import { IsEmail, IsOptional, IsPhoneNumber, IsStrongPassword, IsUrl, Length, Min } from "class-validator";
import { ALLOWED_URL_PROTOCOLS, BaseEntityWithIdAndDates } from "src/shared";
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { MAX_USER_USERNAME_LENGTH, MIN_USER_PASSWORD_LENGTH, MIN_USER_USERNAME_LENGTH, NEW_USER_DEFAULT_ROLE } from "./constants/user-entity.constants";
import { RefreshToken } from "src/auth/entities/jwt.entity";
import { OtpCode } from "src/auth/entities/otp.entity";

@Entity()
export class User extends BaseEntityWithIdAndDates {
    @IsOptional()
    @IsPhoneNumber()
    @Column({unique: true, nullable: true}) 
    phoneNumber: string;

    @Length(MIN_USER_USERNAME_LENGTH, MAX_USER_USERNAME_LENGTH)
    @Column({ length: MAX_USER_USERNAME_LENGTH, unique: true })
    username: string;

    @IsStrongPassword()
    @Min(MIN_USER_PASSWORD_LENGTH)
    @Column({select: false})
    password: string;

    @IsOptional()
    @IsUrl({ protocols: ALLOWED_URL_PROTOCOLS })
    @Column({nullable: true})
    avatar: string;

    @Column({
      unique: true,
      select: false,
    })
    @IsEmail()
    email: string;

    @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
    refreshTokens: RefreshToken[];

    @OneToOne(() => OtpCode, (otp) => otp.user)
    otp: OtpCode;

    @Column({default: NEW_USER_DEFAULT_ROLE})
    role: string;
}
