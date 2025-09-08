"use strict";
'use client';
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
exports.FileUpload = FileUpload;
const react_1 = __importStar(require("react"));
const react_dropzone_1 = require("react-dropzone");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const progress_1 = require("@/components/ui/progress");
const lucide_react_1 = require("lucide-react");
const sonner_1 = require("sonner");
function FileUpload({ onFileUpload, acceptedFileTypes = ['image/*'], maxFileSize = 5 * 1024 * 1024, // 5MB
maxFiles = 10, uploadPath = '/api/upload' }) {
    const [uploadedFiles, setUploadedFiles] = (0, react_1.useState)([]);
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const onDrop = (0, react_1.useCallback)(async (acceptedFiles) => {
        if (acceptedFiles.length === 0)
            return;
        // Validate file size
        const validFiles = acceptedFiles.filter(file => {
            if (file.size > maxFileSize) {
                sonner_1.toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด ${maxFileSize / 1024 / 1024}MB)`);
                return false;
            }
            return true;
        });
        if (validFiles.length === 0)
            return;
        // Check total files limit
        if (uploadedFiles.length + validFiles.length > maxFiles) {
            sonner_1.toast.error(`สามารถอัปโหลดได้สูงสุด ${maxFiles} ไฟล์`);
            return;
        }
        setIsUploading(true);
        // Create preview for images
        const filesWithPreview = validFiles.map(file => ({
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            progress: 0,
            status: 'uploading'
        }));
        setUploadedFiles(prev => [...prev, ...filesWithPreview]);
        // Upload files
        try {
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                const response = await fetch(uploadPath, {
                    method: 'POST',
                    body: formData,
                });
                if (response.ok) {
                    setUploadedFiles(prev => prev.map((f, index) => index === uploadedFiles.length + i
                        ? { ...f, progress: 100, status: 'completed' }
                        : f));
                }
                else {
                    throw new Error('Upload failed');
                }
            }
            onFileUpload(validFiles);
            sonner_1.toast.success(`อัปโหลดไฟล์สำเร็จ ${validFiles.length} ไฟล์`);
        }
        catch (error) {
            sonner_1.toast.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
            setUploadedFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'error' } : f));
        }
        finally {
            setIsUploading(false);
        }
    }, [uploadedFiles.length, maxFiles, maxFileSize, uploadPath, onFileUpload]);
    const { getRootProps, getInputProps, isDragActive } = (0, react_dropzone_1.useDropzone)({
        onDrop,
        accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
        maxSize: maxFileSize,
        disabled: isUploading
    });
    const removeFile = (index) => {
        setUploadedFiles(prev => {
            const newFiles = [...prev];
            if (newFiles[index].preview) {
                URL.revokeObjectURL(newFiles[index].preview);
            }
            newFiles.splice(index, 1);
            return newFiles;
        });
    };
    const clearAll = () => {
        uploadedFiles.forEach(file => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });
        setUploadedFiles([]);
    };
    return (react_1.default.createElement("div", { className: "space-y-4" },
        react_1.default.createElement(card_1.Card, null,
            react_1.default.createElement(card_1.CardContent, { className: "p-6" },
                react_1.default.createElement("div", { ...getRootProps(), className: `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300 hover:border-primary'} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}` },
                    react_1.default.createElement("input", { ...getInputProps() }),
                    react_1.default.createElement(lucide_react_1.Upload, { className: "mx-auto h-12 w-12 text-gray-400 mb-4" }),
                    isDragActive ? (react_1.default.createElement("p", { className: "text-lg font-medium" }, "\u0E27\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48...")) : (react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { className: "text-lg font-medium mb-2" }, "\u0E25\u0E32\u0E01\u0E41\u0E25\u0E30\u0E27\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48 \u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E25\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E1F\u0E25\u0E4C"),
                        react_1.default.createElement("p", { className: "text-sm text-gray-500" },
                            "\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E44\u0E1F\u0E25\u0E4C: ",
                            acceptedFileTypes.join(', '),
                            " | \u0E02\u0E19\u0E32\u0E14\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14: ",
                            maxFileSize / 1024 / 1024,
                            "MB")))))),
        uploadedFiles.length > 0 && (react_1.default.createElement(card_1.Card, null,
            react_1.default.createElement(card_1.CardContent, { className: "p-6" },
                react_1.default.createElement("div", { className: "flex justify-between items-center mb-4" },
                    react_1.default.createElement("h3", { className: "text-lg font-semibold" },
                        "\u0E44\u0E1F\u0E25\u0E4C\u0E17\u0E35\u0E48\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14 (",
                        uploadedFiles.length,
                        ")"),
                    react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: clearAll }, "\u0E25\u0E1A\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")),
                react_1.default.createElement("div", { className: "space-y-3" }, uploadedFiles.map((uploadedFile, index) => (react_1.default.createElement("div", { key: index, className: "flex items-center space-x-3 p-3 border rounded-lg" },
                    react_1.default.createElement("div", { className: "flex-shrink-0" }, uploadedFile.preview ? (react_1.default.createElement("img", { src: uploadedFile.preview, alt: uploadedFile.file.name, className: "w-12 h-12 object-cover rounded" })) : (react_1.default.createElement("div", { className: "w-12 h-12 bg-gray-100 rounded flex items-center justify-center" },
                        react_1.default.createElement(lucide_react_1.File, { className: "w-6 h-6 text-gray-400" })))),
                    react_1.default.createElement("div", { className: "flex-1 min-w-0" },
                        react_1.default.createElement("p", { className: "text-sm font-medium truncate" }, uploadedFile.file.name),
                        react_1.default.createElement("p", { className: "text-xs text-gray-500" },
                            (uploadedFile.file.size / 1024 / 1024).toFixed(2),
                            " MB"),
                        uploadedFile.status === 'uploading' && (react_1.default.createElement(progress_1.Progress, { value: uploadedFile.progress, className: "mt-2" })),
                        uploadedFile.status === 'completed' && (react_1.default.createElement("p", { className: "text-xs text-green-600 mt-1" }, "\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08")),
                        uploadedFile.status === 'error' && (react_1.default.createElement("p", { className: "text-xs text-red-600 mt-1" }, "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14"))),
                    react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => removeFile(index), className: "flex-shrink-0" },
                        react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" })))))))))));
}
