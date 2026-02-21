import { prisma } from "../lib/prisma.js";
import * as DTO from "../types/userDTO.js";
import bcrypt from 'bcryptjs';
import { comparePassword } from "../Utilies/password.js";
import jwt from 'jsonwebtoken';

export const createUser = async (data: DTO.CreateUserDTO) => {
    const hashedPassword = await bcrypt.hash(data.password, 10)
    return prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        }
    })
}

export const logIn = async (data: DTO.LogInDTO) => {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    })
    if (!user) {
        return null;
    }
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
        return null;
    }
    return user;
}



export const generateTokens = async (userId: number, role: string = "USER") => {
    const accessToken = jwt.sign({
        sub: userId,
        role: role
    }, process.env.JWT_SECRET!, {
        expiresIn: "30m"
    })
    const refreshToken = jwt.sign({
        sub: userId
    }, process.env.JWT_SECRET!, {
        expiresIn: "7d"
    })

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            userId: userId
        }
    })

    return { accessToken, refreshToken };

}

