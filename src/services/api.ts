import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Respuesta estándar del API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Clase para gestionar las llamadas al API
 */
class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token JWT a cada petición
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores de respuesta
    this.api.interceptors.response.use(
      (response: any) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token inválido o expirado
          localStorage.removeItem('token');
          localStorage.removeItem('user'); 
          window.location.href = '/auth/signin';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtiene la instancia de axios
   */
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  /**
   * GET - Obtener datos
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<any>(endpoint, { params });
      const raw = response.data;
      if (raw && typeof raw.success === 'undefined' && raw.data !== undefined) {
        return { success: true, data: raw.data } as ApiResponse<T>;
      }
      return raw as ApiResponse<T>;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST - Crear datos
   */
  async post<T>(endpoint: string, data: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post<any>(endpoint, data);
      const raw = response.data;
      if (raw && typeof raw.success === 'undefined' && raw.data !== undefined) {
        return { success: true, data: raw.data } as ApiResponse<T>;
      }
      return raw as ApiResponse<T>;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * PUT - Actualizar datos
   */
  async put<T>(endpoint: string, data: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put<any>(endpoint, data);
      const raw = response.data;
      if (raw && typeof raw.success === 'undefined' && raw.data !== undefined) {
        return { success: true, data: raw.data } as ApiResponse<T>;
      }
      return raw as ApiResponse<T>;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH - Actualización parcial
   */
  async patch<T>(endpoint: string, data: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.patch<any>(endpoint, data);
      const raw = response.data;
      if (raw && typeof raw.success === 'undefined' && raw.data !== undefined) {
        return { success: true, data: raw.data } as ApiResponse<T>;
      }
      return raw as ApiResponse<T>;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE - Eliminar datos
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete<any>(endpoint);
      const raw = response.data;
      if (raw && typeof raw.success === 'undefined' && raw.data !== undefined) {
        return { success: true, data: raw.data } as ApiResponse<T>;
      }
      return raw as ApiResponse<T>;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Maneja errores de las peticiones
   */
  private handleError(error: any): ApiResponse<any> {
    let errorMessage = 'Error desconocido';

    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.statusText) {
        errorMessage = error.response.statusText;
      } else if (error.message) {
        errorMessage = error.message;
      }
    }

    // Log full error to console for developer debugging
    if (import.meta.env.DEV) {
      console.error('API request error:', error);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Almacena el token en localStorage
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Obtiene el token de localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Elimina el token de localStorage
   */
  removeToken(): void {
    localStorage.removeItem('token');
  }
}

export default new ApiService();