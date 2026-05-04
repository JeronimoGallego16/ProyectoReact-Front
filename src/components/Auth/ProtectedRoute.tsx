import { Navigate, Outlet } from "react-router-dom";
import { LocalStorageProvider } from "../../storage/LocalStorageProvider";


const storage = new LocalStorageProvider();

// Función para verificar si el usuario está autenticado
const isAuthenticated = () => {
    const user = storage.getItem("user");

    if (!user) return false;

    try {
        const parsedUser = JSON.parse(user);
        return !!parsedUser; // puedes validar más campos aquí si quieres
    } catch (error) {
        return false;
    }
};

// Componente de Ruta Protegida
const ProtectedRoute = () => {
    return isAuthenticated() ? <Outlet /> : <Navigate to="/auth/signin" replace />;
};

export default ProtectedRoute;