import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
            setData(response.data);
        };
        fetchData();
    }, []);

    if (!data) {
        return <div>Chargement...</div>;
    }

    return (
        <div>
            <h2>Dashboard</h2>
            <div className="row">
                <div className="col-md-3">
                    <div className="card text-white bg-primary mb-3">
                        <div className="card-header">Chiffre d'Affaires (Aujourd'hui)</div>
                        <div className="card-body">
                            <h5 className="card-title">{data.ca_today.toFixed(2)} XOF</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-success mb-3">
                        <div className="card-header">Ventes (Aujourd'hui)</div>
                        <div className="card-body">
                            <h5 className="card-title">{data.ventes_today}</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-dark bg-light mb-3">
                        <div className="card-header">Quantité en Stock</div>
                        <div className="card-body">
                            <h5 className="card-title">{data.total_stock_quantite}</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-dark bg-warning mb-3">
                        <div className="card-header">Valeur du Stock</div>
                        <div className="card-body">
                            <h5 className="card-title">{data.total_stock_valeur.toFixed(2)} XOF</h5>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <h4>Top 5 des Ventes (Aujourd'hui)</h4>
                    <ul className="list-group">
                        {data.top_ventes_today.map(item => (
                            <li key={item.nom} className="list-group-item d-flex justify-content-between align-items-center">
                                {item.nom}
                                <span className="badge bg-primary rounded-pill">{item.quantite_vendue}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="col-md-6">
                    <h4>Produits en Stock Faible</h4>
                    <ul className="list-group">
                        {data.low_stock_produits.map(item => (
                            <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {item.nom}
                                <span className="badge bg-danger rounded-pill">{item.quantite}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
