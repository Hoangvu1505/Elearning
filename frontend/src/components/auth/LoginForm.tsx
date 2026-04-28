import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            // Dummy logic for frontend visualization
            navigate('/dashboard');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
            <h2 className="text-center mb-6">Đăng nhập</h2>
            <div className="form-group">
                <label>Tài khoản</label>
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="form-control" placeholder="Tên đăng nhập" required />
            </div>
            <div className="form-group mb-6">
                <label>Mật khẩu</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-control" placeholder="Mật khẩu" required />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem' }}>Đăng nhập</button>
        </form>
    );
};

export default LoginForm;
