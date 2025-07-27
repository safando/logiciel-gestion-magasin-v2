import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const Ventes = () => {
    const [ventes, setVentes] = useState([]);
    const [produits, setProduits] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentVente, setCurrentVente] = useState(null);

    useEffect(() => {
        fetchVentes();
        fetchProduits();
    }, []);

    const fetchVentes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/ventes', { headers: { Authorization: `Bearer ${token}` } });
            setVentes(response.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des ventes.");
        }
    };

    const fetchProduits = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/produits', { headers: { Authorization: `Bearer ${token}` } });
            setProduits(response.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des produits.");
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setCurrentVente(null);
    };

    const handleShow = (vente = null) => {
        setCurrentVente(vente);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette vente ?")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`/api/ventes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Vente supprimée avec succès.");
                fetchVentes();
            } catch (error) {
                toast.error("Erreur lors de la suppression de la vente.");
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const data = {
            produit_id: parseInt(e.target.produit_id.value),
            quantite: parseInt(e.target.quantite.value),
        };

        try {
            if (currentVente) {
                await axios.put(`/api/ventes/${currentVente.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Vente mise à jour avec succès.");
            } else {
                await axios.post('/api/ventes', data, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Vente ajoutée avec succès.");
            }
            fetchVentes();
            fetchProduits(); // Refresh product stock
            handleClose();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement de la vente.");
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Ventes</h2>
                <Button variant="primary" onClick={() => handleShow()}>Ajouter une vente</Button>
            </div>

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Quantité</th>
                        <th>Prix Total</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {ventes.map(v => (
                        <tr key={v.id}>
                            <td>{v.produit.nom}</td>
                            <td>{v.quantite}</td>
                            <td>{v.prix_total.toFixed(2)} XOF</td>
                            <td>{new Date(v.date).toLocaleString('fr-FR')}</td>
                            <td>
                                <Button variant="warning" size="sm" onClick={() => handleShow(v)}><i className="fas fa-pencil-alt"></i></Button>
                                <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDelete(v.id)}><i className="fas fa-trash"></i></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{currentVente ? 'Modifier' : 'Ajouter'} une vente</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSave}>
                        <Form.Group className="mb-3">
                            <Form.Label>Produit</Form.Label>
                            <Form.Select name="produit_id" defaultValue={currentVente?.produit.id} required>
                                <option value="">Choisir un produit</option>
                                {produits.map(p => (
                                    <option key={p.id} value={p.id}>{p.nom} (Stock: {p.quantite})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Quantité</Form.Label>
                            <Form.Control type="number" name="quantite" defaultValue={currentVente?.quantite} required />
                        </Form.Group>
                        <Button variant="primary" type="submit">Enregistrer</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Ventes;
