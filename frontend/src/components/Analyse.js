import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Analyse = () => {
    const [data, setData] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/analyse?start_date=${startDate}&end_date=${endDate}`, { headers: { Authorization: `Bearer ${token}` } });
            setData(response.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des données d'analyse.");
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!data) {
        return <div>Chargement...</div>;
    }

    const lineChartData = {
        labels: data.graph_data.map(d => d.jour),
        datasets: [
            {
                label: 'Chiffre d\'affaires par jour',
                data: data.graph_data.map(d => d.ca_jour),
                fill: false,
                backgroundColor: 'rgb(75, 192, 192)',
                borderColor: 'rgba(75, 192, 192, 0.2)',
            },
        ],
    };

    const barChartData = {
        labels: data.top_profitable_products.map(p => p.nom),
        datasets: [
            {
                label: 'Top 5 Produits Rentables',
                data: data.top_profitable_products.map(p => p.total_profit),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
        ],
    };

    return (
        <div>
            <h2>Analyse</h2>
            <div className="row mb-3">
                <div className="col">
                    <label>Date de début</label>
                    <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="col">
                    <label>Date de fin</label>
                    <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            <div className="row">
                <div className="col-md-3">
                    <div className="card text-white bg-primary mb-3">
                        <div className="card-header">Chiffre d'Affaires</div>
                        <div className="card-body">
                            <h5 className="card-title">{data.chiffre_affaires.toFixed(2)} XOF</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-success mb-3">
                        <div className="card-header">Bénéfice</div>
                        <div className="card-body">
                            <h5 className="card-title">{data.benefice.toFixed(2)} XOF</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-danger mb-3">
                        <div className="card-header">Dépenses</div>
                        <div className="card-body">
                            <h5 className="card-title">{data.depenses.toFixed(2)} XOF</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-info mb-3">
                        <div className="card-header">Bénéfice Net</div>
                        <div className="card-body">
                            <h5 className="card-title">{data.benefice_net.toFixed(2)} XOF</h5>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <h4>Chiffre d'affaires</h4>
                    <Line data={lineChartData} />
                </div>
                <div className="col-md-6">
                    <h4>Top 5 Produits Rentables</h4>
                    <Bar data={barChartData} />
                </div>
            </div>
        </div>
    );
};

export default Analyse;
