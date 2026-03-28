import { Navigate } from 'react-router-dom';

/** Index redirects to landing — this file exists only as a fallback */
const Index = () => <Navigate to="/" replace />;

export default Index;
