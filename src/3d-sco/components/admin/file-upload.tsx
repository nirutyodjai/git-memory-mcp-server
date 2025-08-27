'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Image, File } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  uploadPath?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export function FileUpload({
  onFileUpload,
  acceptedFileTypes = ['image/*'],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 10,
  uploadPath = '/api/upload'
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Validate file size
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxFileSize) {
        toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด ${maxFileSize / 1024 / 1024}MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Check total files limit
    if (uploadedFiles.length + validFiles.length > maxFiles) {
      toast.error(`สามารถอัปโหลดได้สูงสุด ${maxFiles} ไฟล์`);
      return;
    }

    setIsUploading(true);

    // Create preview for images
    const filesWithPreview = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'uploading' as const
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
          setUploadedFiles(prev => 
            prev.map((f, index) => 
              index === uploadedFiles.length + i 
                ? { ...f, progress: 100, status: 'completed' }
                : f
            )
          );
        } else {
          throw new Error('Upload failed');
        }
      }

      onFileUpload(validFiles);
      toast.success(`อัปโหลดไฟล์สำเร็จ ${validFiles.length} ไฟล์`);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      setUploadedFiles(prev => 
        prev.map(f => 
          f.status === 'uploading' ? { ...f, status: 'error' } : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  }, [uploadedFiles.length, maxFiles, maxFileSize, uploadPath, onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    disabled: isUploading
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">วางไฟล์ที่นี่...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  ลากและวางไฟล์ที่นี่ หรือคลิกเพื่อเลือกไฟล์
                </p>
                <p className="text-sm text-gray-500">
                  รองรับไฟล์: {acceptedFileTypes.join(', ')} | ขนาดสูงสุด: {maxFileSize / 1024 / 1024}MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">ไฟล์ที่อัปโหลด ({uploadedFiles.length})</h3>
              <Button variant="outline" size="sm" onClick={clearAll}>
                ลบทั้งหมด
              </Button>
            </div>
            
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <File className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {uploadedFile.status === 'uploading' && (
                      <Progress value={uploadedFile.progress} className="mt-2" />
                    )}
                    
                    {uploadedFile.status === 'completed' && (
                      <p className="text-xs text-green-600 mt-1">อัปโหลดสำเร็จ</p>
                    )}
                    
                    {uploadedFile.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">เกิดข้อผิดพลาด</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}