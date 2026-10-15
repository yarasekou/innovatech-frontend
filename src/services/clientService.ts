import api from './api';
import type { ClientRequest, ClientResponse } from '../types/client';

export const clientService = {
    // ============================================================
    // READ
    // ============================================================
    async getClients(): Promise<ClientResponse[]> {
        const response = await api.get<ClientResponse[]>('/clients');
        return response.data;
    },

    async getClientById(id: number): Promise<ClientResponse> {
        const response = await api.get<ClientResponse>(`/clients/${id}`);
        return response.data;
    },

    async searchClients(query: string): Promise<ClientResponse[]> {
        const response = await api.get<ClientResponse[]>('/clients/search', {
            params: { q: query },
        });
        return response.data;
    },

    // ============================================================
    // CREATE
    // ============================================================
    async createClient(data: ClientRequest): Promise<ClientResponse> {
        const response = await api.post<ClientResponse>('/clients', data);
        return response.data;
    },

    // ============================================================
    // UPDATE
    // ============================================================
    async updateClient(id: number, data: ClientRequest): Promise<ClientResponse> {
        const response = await api.put<ClientResponse>(`/clients/${id}`, data);
        return response.data;
    },

    // ============================================================
    // DELETE / DEACTIVATE
    // ============================================================
    async deleteClient(id: number): Promise<void> {
        await api.delete(`/clients/${id}`);
    },

    async deactivateClient(id: number): Promise<void> {
        await api.patch(`/clients/${id}/deactivate`);
    },
};