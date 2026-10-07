import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { companyContextStorage } from './context';
import { warmUpConnections } from './connection_manager';

@Injectable()
export class CompanyContextMiddleware implements NestMiddleware {
    async use(req: Request, res: Response, next: NextFunction) {
        const companyId = req.headers['x-company-id'] || req.headers['company-id'];
        const companyUnique = req.headers['x-company-unique'] || req.headers['company-unique'];

        console.log(`[Middleware] Request: ${req.method} ${req.url} | Company-ID: ${companyId} | Unique: ${companyUnique}`);

        if (companyId && companyUnique) {
            try {
                // Async warm up of the connections before request continues
                console.log(`[Middleware] Warming up dynamic connections for Company-ID: ${companyId} | Unique: ${companyUnique}`);
                await warmUpConnections(companyUnique.toString(), companyId.toString());
            } catch (err) {
                console.error(`[Middleware] Failed to warm up dynamic connections:`, err);
            }
        }

        companyContextStorage.run({
            companyId: companyId ? companyId.toString() : null,
            companyUnique: companyUnique ? companyUnique.toString() : null
        }, () => {
            next();
        });
    }
}

// [commit 79]: feat(middleware): support multi-database context switching via company header
