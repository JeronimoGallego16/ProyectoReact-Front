import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface Props {
    children: JSX.Element;
    roles: string[];
}

export default function ProtectedRoute({ children, roles }: Props) {
    const user = useSelector((state: RootState) => state.user.user);

    // No está logueado
    if (!user) return <Navigate to="/auth/signin" replace />;

    // No tiene el rol requerido
    if (!roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}