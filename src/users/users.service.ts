import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FindOneOptions, Repository, SaveOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { ERRORS_MSG, hashValue } from 'src/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const createdUser = await this.userRepository.save({
        ...createUserDto,
        password: await hashValue(createUserDto.password),
      });
      
      return createdUser;
      
    } catch (err) { 
       
      if ('code' in err) {
        if (err.code === '23505')
          throw new ConflictException(ERRORS_MSG.USER_EXIST_ERR_MSG);
      }
    }
  }

  async findOne(userParams: FindOneOptions<User>) {
    const user = await this.userRepository.findOne(userParams);

    if (!user) {
      throw new NotFoundException(ERRORS_MSG.USER_NOT_FOUND);
    }

    return user;
  }

  async save(userForSave: User,  userOptions?: SaveOptions) {
    const user = await this.userRepository.save(userForSave, userOptions);
    return user;
  }
}
