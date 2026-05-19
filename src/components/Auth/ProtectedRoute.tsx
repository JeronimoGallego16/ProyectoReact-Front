import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface Props {
    children: JSX.Element;
    roles: string[];
}

export default function ProtectedRoute({ children, roles }: Props) {
    const user = useSelector((state: RootState) => state.user.user);

    if (!user) return <Navigate to="/auth/signin" replace />;

    if (!roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}