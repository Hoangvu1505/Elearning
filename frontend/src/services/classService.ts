import api from './api';

export const getClasses = async () => {
    const response = await api.get('/classes');
    return response.data;
};
