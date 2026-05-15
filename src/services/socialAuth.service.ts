import { auth } from "../config/firebase";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { store } from "../store/store";
import { setUser } from "../store/userSlice";
import { User } from "../models/user";

class SocialAuthService {
  // Google
  async loginWithGoogle() {git 
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userData: User = {
        id: user.uid,
        email: user.email || "",
        code: user.uid,
        role: "STUDENT",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.dispatch(setUser(userData));
      localStorage.setItem("token", await user.getIdToken());
      localStorage.setItem("user", JSON.stringify(userData));

      return user;
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

      const userData: User = {
        id: user.uid,
        email: user.email || "",
        code: user.uid,
        role: "STUDENT",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.dispatch(setUser(userData));
      localStorage.setItem("token", await user.getIdToken());
      localStorage.setItem("user", JSON.stringify(userData));

      return user;
    } catch (error) {
      console.error("Error en GitHub login:", error);
      throw error;
    }
  }

  // Microsoft
  async loginWithMicrosoft() {
    const provider = new OAuthProvider("microsoft.com");
    provider.addScopes("mail.read", "calendar.read");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userData: User = {
        id: user.uid,
        email: user.email || "",
        code: user.uid,
        role: "STUDENT",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.dispatch(setUser(userData));
      localStorage.setItem("token", await user.getIdToken());
      localStorage.setItem("user", JSON.stringify(userData));

      return user;
    } catch (error) {
      console.error("Error en Microsoft login:", error);
      throw error;
    }
  }
}

export default new SocialAuthService();
