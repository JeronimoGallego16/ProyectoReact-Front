import apiService, { ApiResponse } from './api';
import { Admin } from '../models/Admin';
import { CreateAdminPayload, UpdateAdminPayload } from '../models/AdminPayload';

/**
 * Servicio específico para Administradores
 */
class AdminService {
  private endpoint = '/users';
  private searchEndpoint = '/users/search';

  /**
   * Listar todos los administradores
   */
  async getAllAdmins(): Promise<ApiResponse<Admin[]>> {
    return apiService.get<Admin[]>(this.searchEndpoint, { role: 'ADMIN' });
  }

  /**
   * Obtener un administrador por ID
   */
  async getAdminById(adminId: string): Promise<ApiResponse<Admin>> {
    return apiService.get<Admin>(`${this.endpoint}/${adminId}`);
  }

  /**
   * Crear un nuevo administrador
   */
  async createAdmin(payload: CreateAdminPayload): Promise<ApiResponse<Admin>> {
    return apiService.post<Admin>(this.endpoint, {
      ...payload,
      role: 'ADMIN',
    });
  }

  /**
   * Actualizar datos del administrador
   */
  async updateAdmin(adminId: string, payload: UpdateAdminPayload): Promise<ApiResponse<Admin>> {
    return apiService.put<Admin>(`${this.endpoint}/${adminId}`, payload);
  }

  /**
   * Desactivar administrador
   */
  async deactivateAdmin(adminId: string): Promise<ApiResponse<Admin>> {
    return apiService.patch<Admin>(`${this.endpoint}/${adminId}/deactivate`, {});
  }

  /**
   * Eliminar administrador
   */
  async deleteAdmin(adminId: string): Promise<ApiResponse<any>> {
    return apiService.delete<any>(`${this.endpoint}/${adminId}`);
  }
}

export default new AdminService();
