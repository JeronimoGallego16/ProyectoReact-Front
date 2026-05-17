import axios from "axios";
import { auth } from "../config/firebase";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { store } from "../store/store";
import { setUser } from "../store/userSlice";
import { User } from "../models/user";

class SocialAuthService {
  private axios: any;

  constructor() {
    this.axios = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  private async verifyUserInBackend(email: string): Promise<User> {
    try {
      // Obtiene la lista de todos los usuarios registrados
      const response = await this.axios.get('/users');
      
      if (!response.data?.data || !Array.isArray(response.data.data)) {
        throw new Error('Error al obtener usuarios');
      }
      
      // Busca el usuario por email localmente
      const user = response.data.data.find((u: any) => u.email === email);
      
      if (!user) {
        throw new Error(`Usuario con email ${email} no registrado en el sistema`);
      }
      
      return user;
    } catch (error: any) {
      if (error.message?.includes('no registrado')) {
        throw error;
      }
      throw new Error(`Error al verificar usuario: ${error.message}`);
    }
  }
  // Google
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const firebaseToken = await user.getIdToken();

      // Verificar que el usuario existe en el backend (solo por email)
      const backendUser = await this.verifyUserInBackend(user.email || "");

      store.dispatch(setUser(backendUser));
      localStorage.setItem("token", firebaseToken);
      localStorage.setItem("user", JSON.stringify(backendUser));

      return backendUser;
    } catch (error) {
      console.error("Error en Google login:", error);
      throw error;
    }
  }

  // GitHub
  async loginWithGithub() {
    const provider = new GithubAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const firebaseToken = await user.getIdToken();

      // Verificar que el usuario existe en el backend (solo por email)
      const backendUser = await this.verifyUserInBackend(user.email || "");

      store.dispatch(setUser(backendUser));
      localStorage.setItem("token", firebaseToken);
      localStorage.setItem("user", JSON.stringify(backendUser));

      return backendUser;
    } catch (error) {
      console.error("Error en GitHub login:", error);
      throw error;
    }
  }

  // Microsoft
  async loginWithMicrosoft() {
    const provider = new OAuthProvider("microsoft.com");

    provider.addScope("Mail.Read");
    provider.addScope("Calendars.Read");

    // Fuerza a Microsoft a mostrar selector de cuenta
    provider.setCustomParameters({
      prompt: "select_account",
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const firebaseToken = await user.getIdToken();

      // Verificar que el usuario existe en el backend (solo por email)
      const backendUser = await this.verifyUserInBackend(user.email || "");

      store.dispatch(setUser(backendUser));
      localStorage.setItem("token", firebaseToken);
      localStorage.setItem("user", JSON.stringify(backendUser));

      return backendUser;
    } catch (error) {
      console.error("Error en Microsoft login:", error);
      throw error;
    }
  }

  // Logout completo
  async logout() {
    try {
      await signOut(auth);

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href =
        "https://login.microsoftonline.com/common/oauth2/v2.0/logout";
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      throw error;
    }
  }
}

export default new SocialAuthService();

