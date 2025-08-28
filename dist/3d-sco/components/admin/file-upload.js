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
    return (<div className="space-y-4">
      <card_1.Card>
        <card_1.CardContent className="p-6">
          <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary'} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input {...getInputProps()}/>
            <lucide_react_1.Upload className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
            {isDragActive ? (<p className="text-lg font-medium">วางไฟล์ที่นี่...</p>) : (<div>
                <p className="text-lg font-medium mb-2">
                  ลากและวางไฟล์ที่นี่ หรือคลิกเพื่อเลือกไฟล์
                </p>
                <p className="text-sm text-gray-500">
                  รองรับไฟล์: {acceptedFileTypes.join(', ')} | ขนาดสูงสุด: {maxFileSize / 1024 / 1024}MB
                </p>
              </div>)}
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {uploadedFiles.length > 0 && (<card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">ไฟล์ที่อัปโหลด ({uploadedFiles.length})</h3>
              <button_1.Button variant="outline" size="sm" onClick={clearAll}>
                ลบทั้งหมด
              </button_1.Button>
            </div>
            
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile, index) => (<div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (<img src={uploadedFile.preview} alt={uploadedFile.file.name} className="w-12 h-12 object-cover rounded"/>) : (<div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <lucide_react_1.File className="w-6 h-6 text-gray-400"/>
                      </div>)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {uploadedFile.status === 'uploading' && (<progress_1.Progress value={uploadedFile.progress} className="mt-2"/>)}
                    
                    {uploadedFile.status === 'completed' && (<p className="text-xs text-green-600 mt-1">อัปโหลดสำเร็จ</p>)}
                    
                    {uploadedFile.status === 'error' && (<p className="text-xs text-red-600 mt-1">เกิดข้อผิดพลาด</p>)}
                  </div>
                  
                  <button_1.Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="flex-shrink-0">
                    <lucide_react_1.X className="w-4 h-4"/>
                  </button_1.Button>
                </div>))}
            </div>
          </card_1.CardContent>
        </card_1.Card>)}
    </div>);
}
//# sourceMappingURL=file-upload.js.map