'use server';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ai = void 0;
var genkit_1 = require("genkit");
var plugin_1 = require("@genkit-ai/firebase/plugin");
var googleai_1 = require("@genkit-ai/googleai");
exports.ai = (0, genkit_1.genkit)({
    plugins: [
        (0, plugin_1.firebase)(),
        (0, googleai_1.googleAI)(),
    ],
});
