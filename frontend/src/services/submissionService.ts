import api from './api';

export const submitAssignment = async (assignmentId: string, fileData: FormData) => {
    const response = await api.post(`/assignments/${assignmentId}/submit`, fileData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
