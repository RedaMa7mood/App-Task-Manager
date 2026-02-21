import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
export const comparePassword = (
    candidatePassword: string,
    hashedPassword: string) => {
    return bcrypt.compare(candidatePassword, hashedPassword)
}


