"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// src/lib/prisma.ts
const client_1 = require("@prisma/client");
// named export (existing code in repo expects `prisma`)
exports.prisma = (_a = globalThis.prisma) !== null && _a !== void 0 ? _a : new client_1.PrismaClient();
// cache on global in dev
if (process.env.NODE_ENV !== "production")
    globalThis.prisma = exports.prisma;
// default export added so files that do `import prisma from "@/lib/prisma"` also work
exports.default = exports.prisma;
