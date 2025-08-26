const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export interface UploadProgress {
  (progress: number): void;
}

export interface MediaResponse {
  id: string;
  filename: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  status: string;
  uploadedAt: string;
}

export const uploadMedia = async (
  file: File, 
  userId: string, 
  onProgress?: UploadProgress
): Promise<MediaResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  try {
    const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const getMediaList = async (): Promise<MediaResponse[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/media`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export const getMediaById = async (id: string): Promise<MediaResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/media/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export const deleteMedia = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/media/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete media: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

export const getMediaStatus = async (id: string): Promise<{ status: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/media/${id}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch status: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
};
