import api from "./index";

export interface UploadResponse {
    fileUrl: string;
    fileType: string;
    fileSize: number;
}

// Zapis pliku do bucketa w Supabase
export const uploadFile = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await api.post<UploadResponse>('/api/storage/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return res.data;
    } catch (err) {
        console.error("Failed to upload file", err);
        throw err;
    }
};