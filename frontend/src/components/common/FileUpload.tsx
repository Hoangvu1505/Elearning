import React, { useRef } from 'react';

const FileUpload: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log("File selected:", file.name);
            // Handle file upload
        }
    };

    return (
        <div className="file-upload">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
            />
            <button onClick={handleUploadClick} className="btn-upload btn-primary">
                Upload File
            </button>
        </div>
    );
};

export default FileUpload;
