import { File } from 'lucide-react';
interface FileUploadProps {
    onFileUpload: (files: File[]) => void;
    acceptedFileTypes?: string[];
    maxFileSize?: number;
    maxFiles?: number;
    uploadPath?: string;
}
export declare function FileUpload({ onFileUpload, acceptedFileTypes, maxFileSize, // 5MB
maxFiles, uploadPath }: FileUploadProps): any;
export {};
//# sourceMappingURL=file-upload.d.ts.map