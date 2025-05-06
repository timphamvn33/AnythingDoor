import { Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UpdatePasswordDto } from '@auth/use-cases/dto/update-password.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }

  async updateUser(data: UpdateUserDto, id: string) {
    const { email, ...updateUserData } = data;
    console.log('id..........: ', id);
    if (email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      // If the email exists and belongs to a different user, throw error
      if (existingUser && existingUser.id !== id) {
        throw new NotImplementedException('Email already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { ...updateUserData, ...(email && { email }) },
    });
  }

  async updatePassword(data: UpdatePasswordDto) {
    const { id, ...updateUserPassword } = data;
    return this.prisma.user.update({ where: { id }, data: updateUserPassword });
  }
  async deleteUserById(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.delete({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
