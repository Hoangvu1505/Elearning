import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 
                                 (typeof err.response?.data === 'string' ? err.response.data : null) || 
                                 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
            <h2 className="text-center mb-6">Đăng nhập</h2>
            
            {error && (
                <div style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#dc2626', 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem', 
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    border: '1px solid #fecaca'
                }}>
                    {error}
                </div>
            )}

            <div className="form-group">
                <label>Email hoặc Mã số</label>
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="form-control" placeholder="Email hoặc mã số (VD: abc@gmail.com)" required />
            </div>
            <div className="form-group mb-6">
                <label>Mật khẩu</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-control" placeholder="Mật khẩu" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ padding: '0.75rem' }}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
        </form>
    );
};

export default LoginForm;
