"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const AceTernityLogo = (props) => (<svg xmlns="http://www.w3.org/2000/svg" width={85.333} height={85.333} viewBox="0 0 64 64" {...props} fill="#fff">
    <path d="M25.9 14.7C22.5 23.4 13 50.3 13 51.1c0 .5 2 .9 4.3.9h4.4l5-13.8 5-13.7 4.7-.3c5.3-.4 5.4-.7 2.1-8.5C37 12.1 36.8 12 32 12c-4.6 0-5.1.3-6.1 2.7z"/>
    <path d="M34.5 30.2c-.2.7-2 5.5-4 10.6C28.6 46 27 50.6 27 51.1s1.7.9 3.9.9c3.6 0 3.9-.3 5.5-4.3.9-2.3 1.6-4.8 1.6-5.5 0-3 1.8-.7 3.4 4.3 1.7 5.4 1.7 5.5 5.7 5.5 2.5 0 3.9-.5 3.9-1.3-.1-.6-1.8-5.7-3.9-11.2l-3.8-10-4.2-.3c-2.7-.2-4.3.1-4.6 1z"/>
  </svg>);
exports.default = AceTernityLogo;
//# sourceMappingURL=aceternity.js.map