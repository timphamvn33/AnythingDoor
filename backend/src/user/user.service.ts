import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  createUser(data: CreateUserDto) {
    console.log('hello create user');
    return this.prisma.user.create({ data });
  }

  deleteUserbyId(id: string) {
    return this.prisma.user.delete({ where: { id: id } });
  }
}
