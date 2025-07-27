import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/token', new URLSearchParams({ username, password }));
            setToken(response.data.access_token);
        } catch (err) {
            setError('Nom d\'utilisateur ou mot de passe incorrect.');
        }
    };

    return (
        <div className="container vh-100 d-flex justify-content-center align-items-center">
            <div className="card p-4" style={{ width: '100%', maxWidth: '400px' }}>
                <h3 className="text-center mb-4">Connexion</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label>Nom d'utilisateur</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Entrez votre nom d'utilisateur"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Entrez votre mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-danger">{error}</p>}
                    <button type="submit" className="btn btn-primary w-100">Se connecter</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
