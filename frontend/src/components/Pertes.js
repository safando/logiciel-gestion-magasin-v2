import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const Pertes = () => {
    const [pertes, setPertes] = useState([]);
    const [produits, setProduits] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentPerte, setCurrentPerte] = useState(null);

    useEffect(() => {
        fetchPertes();
        fetchProduits();
    }, []);

    const fetchPertes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/pertes', { headers: { Authorization: `Bearer ${token}` } });
            setPertes(response.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des pertes.");
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
        setCurrentPerte(null);
    };

    const handleShow = (perte = null) => {
        setCurrentPerte(perte);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette perte ?")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`/api/pertes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Perte supprimée avec succès.");
                fetchPertes();
            } catch (error) {
                toast.error("Erreur lors de la suppression de la perte.");
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
            if (currentPerte) {
                await axios.put(`/api/pertes/${currentPerte.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Perte mise à jour avec succès.");
            } else {
                await axios.post('/api/pertes', data, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Perte ajoutée avec succès.");
            }
            fetchPertes();
            fetchProduits(); // Refresh product stock
            handleClose();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement de la perte.");
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Pertes</h2>
                <Button variant="primary" onClick={() => handleShow()}>Ajouter une perte</Button>
            </div>

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Quantité</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pertes.map(p => (
                        <tr key={p.id}>
                            <td>{p.produit.nom}</td>
                            <td>{p.quantite}</td>
                            <td>{new Date(p.date).toLocaleString('fr-FR')}</td>
                            <td>
                                <Button variant="warning" size="sm" onClick={() => handleShow(p)}><i className="fas fa-pencil-alt"></i></Button>
                                <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDelete(p.id)}><i className="fas fa-trash"></i></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{currentPerte ? 'Modifier' : 'Ajouter'} une perte</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSave}>
                        <Form.Group className="mb-3">
                            <Form.Label>Produit</Form.Label>
                            <Form.Select name="produit_id" defaultValue={currentPerte?.produit.id} required>
                                <option value="">Choisir un produit</option>
                                {produits.map(p => (
                                    <option key={p.id} value={p.id}>{p.nom} (Stock: {p.quantite})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Quantité</Form.Label>
                            <Form.Control type="number" name="quantite" defaultValue={currentPerte?.quantite} required />
                        </Form.Group>
                        <Button variant="primary" type="submit">Enregistrer</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Pertes;
