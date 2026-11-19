import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    private vector: Buffer = Buffer.from([240, 3, 45, 29, 0, 76, 173, 59]);
    private cryptoKey: string;
    private transporter;

    constructor(
        @InjectDataSource('userConnection') private config: DataSource
    ) {
        this.cryptoKey = "A quick brown fox jumped over lazy dog.";
    }

    async findOne(username: string) {
        try {
            const res = await this.config.query(`SELECT * FROM USRMSTUSERS WHERE USER_ID='${username}' AND STATUS_CODE=0`);
            if (res && res.length > 0) return res;
        } catch (e) {
            // fallback if table name differs
        }
        return await this.config.query(`SELECT * FROM USERS WHERE USER_ID='${username}'`);
    }

    async getAssignedCompanies(userId: string) {
        try {
            return await this.config.query(`
                SELECT *, NAME AS COMPANY_NAME
                FROM CNFCOMPANY
                WHERE STATUS_CODE = 0
            `);
        } catch (e) {
            return [];
        }
    }

    // Method to encrypt a string using 3DES
    public encrypt3DES(inputText: string): string {
        const md5Key = crypto.createHash('md5').update(this.cryptoKey).digest();
        const tripleDesKey = Buffer.concat([md5Key, md5Key.slice(0, 8)]); // Create a 24-byte key
        const cipher = crypto.createCipheriv('des-ede3-cbc', tripleDesKey, this.vector);

        let encrypted = cipher.update(inputText, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    // Method to decrypt a string using 3DES
    public decrypt3DES(encryptedText: string): string {
        const md5Key = crypto.createHash('md5').update(this.cryptoKey).digest();
        const tripleDesKey = Buffer.concat([md5Key, md5Key.slice(0, 8)]); // Create a 24-byte key
        const decipher = crypto.createDecipheriv('des-ede3-cbc', tripleDesKey, this.vector);

        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }


    //--------------------------------- to reset password -----------------------------------------

    async sendPasswordResetEmail(email: string) {
        const user = await this.config.query(
            `SELECT * FROM USERS WHERE EMAIL_ID='${email}'`
        );
        if (user.length == 0) {
            throw new BadRequestException('User with this email does not exist. Contact admin.', {
                cause: new Error(),
                description: 'User with this email does not exist. Contact admin.',
            });
        } else {
            const resetLink = `http://192.168.1.156/MachEasy/auth/reset-password`;

            await this.transporter.sendMail({
                from: 'vinayakmandare21@gmail.com',
                to: email,
                subject: 'Reset Your Password',
                html: `<p>Click the link below to reset your password:</p>
                     <a href="${resetLink}">Reset Password</a>`,
            });

            return { message: 'Reset password email sent!' };
        }
    }

    //--------------------------------- to reset password -----------------------------------------

    async updatePassword(email: string, newPassword: string, user_id: string) {
        // Check if the email exists in the database
        const user = await this.config.query(
            `SELECT * FROM USERS WHERE EMAIL_ID='${email}' AND USER_ID = '${user_id}'`
        );
        if (user.length == 0) {
            throw new BadRequestException('User with this email does not exist. Contact admin.', {
                cause: new Error(),
                description: 'User with this email does not exist. Contact admin.',
            });
        }

        const encrypt = this.encrypt3DES(newPassword);
        // If user exists, update the password
        await this.config.query(
            `UPDATE USERS SET PASSWORD='${encrypt}' WHERE EMAIL_ID='${email}' AND USER_ID = '${user_id}'`
        );

        return { message: 'Password updated successfully!' };
    }
}
