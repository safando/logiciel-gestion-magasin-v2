import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './components/Dashboard';
import Stock from './components/Stock';
import Ventes from './components/Ventes';
import Pertes from './components/Pertes';
import Frais from './components/Frais';
import Analyse from './components/Analyse';
import Admin from './components/Admin';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const App = () => {
    return (
        <ThemeProvider>
            <MainApp />
            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} />
        </ThemeProvider>
    );
}

const MainApp = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    if (!token) {
        return <Login setToken={setToken} />;
    }

    return (
        <Router>
            <div className="d-flex">
                <nav className={`sidebar vh-100 p-3 ${theme === 'light' ? 'bg-light text-dark' : 'bg-dark text-white'} ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <h4 className="text-center">Gestion Magasin</h4>
                    <hr />
                    <ul className="nav nav-pills flex-column mb-auto">
                        <li className="nav-item"><Link to="/" className={`nav-link ${theme === 'light' ? 'text-dark' : 'text-white'}`}><i className="fas fa-tachometer-alt me-2"></i>Dashboard</Link></li>
                        <li><Link to="/stock" className={`nav-link ${theme === 'light' ? 'text-dark' : 'text-white'}`}><i className="fas fa-box me-2"></i>Stock</Link></li>
                        <li><Link to="/ventes" className={`nav-link ${theme === 'light' ? 'text-dark' : 'text-white'}`}><i className="fas fa-shopping-cart me-2"></i>Ventes</Link></li>
                        <li><Link to="/pertes" className={`nav-link ${theme === 'light' ? 'text-dark' : 'text-white'}`}><i className="fas fa-trash-alt me-2"></i>Pertes</Link></li>
                        <li><Link to="/frais" className={`nav-link ${theme === 'light' ? 'text-dark' : 'text-white'}`}><i className="fas fa-file-invoice-dollar me-2"></i>Frais</Link></li>
                        <li><Link to="/analyse" className={`nav-link ${theme === 'light' ? 'text-dark' : 'text-white'}`}><i className="fas fa-chart-line me-2"></i>Analyse</Link></li>
                        <li><Link to="/admin" className={`nav-link ${theme === 'light' ? 'text-dark' : 'text-white'}`}><i className="fas fa-user-shield me-2"></i>Admin</Link></li>
                    </ul>
                    <hr />
                    <div className="d-flex justify-content-between">
                        <button className="btn btn-danger" onClick={() => setToken(null)}>Déconnexion</button>
                        <button className="btn btn-secondary" onClick={toggleTheme}><i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i></button>
                    </div>
                </nav>

                <main className="main-content p-4">
                    <button className="btn btn-light d-md-none sidebar-toggle mb-3" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}><i className="fas fa-bars"></i></button>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/stock" element={<Stock />} />
                        <Route path="/ventes" element={<Ventes />} />
                        <Route path="/pertes" element={<Pertes />} />
                        <Route path="/frais" element={<Frais />} />
                        <Route path="/analyse" element={<Analyse />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
