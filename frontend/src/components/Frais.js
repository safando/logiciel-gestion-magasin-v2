import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const Frais = () => {
    const [frais, setFrais] = useState([]);
    const [produits, setProduits] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentFrais, setCurrentFrais] = useState(null);

    useEffect(() => {
        fetchFrais();
        fetchProduits();
    }, []);

    const fetchFrais = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/frais', { headers: { Authorization: `Bearer ${token}` } });
            setFrais(response.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des frais.");
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
        setCurrentFrais(null);
    };

    const handleShow = (frais = null) => {
        setCurrentFrais(frais);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce frais ?")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`/api/frais/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Frais supprimé avec succès.");
                fetchFrais();
            } catch (error) {
                toast.error("Erreur lors de la suppression du frais.");
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const data = {
            produit_id: parseInt(e.target.produit_id.value),
            description: e.target.description.value,
            montant: parseFloat(e.target.montant.value),
        };

        try {
            if (currentFrais) {
                await axios.put(`/api/frais/${currentFrais.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Frais mis à jour avec succès.");
            } else {
                await axios.post('/api/frais', data, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Frais ajouté avec succès.");
            }
            fetchFrais();
            handleClose();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement du frais.");
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Frais Annexes</h2>
                <Button variant="primary" onClick={() => handleShow()}>Ajouter un frais</Button>
            </div>

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Description</th>
                        <th>Montant</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {frais.map(f => (
                        <tr key={f.id}>
                            <td>{f.produit.nom}</td>
                            <td>{f.description}</td>
                            <td>{f.montant.toFixed(2)} XOF</td>
                            <td>{new Date(f.date).toLocaleString('fr-FR')}</td>
                            <td>
                                <Button variant="warning" size="sm" onClick={() => handleShow(f)}><i className="fas fa-pencil-alt"></i></Button>
                                <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDelete(f.id)}><i className="fas fa-trash"></i></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{currentFrais ? 'Modifier' : 'Ajouter'} un frais</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSave}>
                        <Form.Group className="mb-3">
                            <Form.Label>Produit</Form.Label>
                            <Form.Select name="produit_id" defaultValue={currentFrais?.produit.id} required>
                                <option value="">Choisir un produit</option>
                                {produits.map(p => (
                                    <option key={p.id} value={p.id}>{p.nom}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control type="text" name="description" defaultValue={currentFrais?.description} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Montant</Form.Label>
                            <Form.Control type="number" step="0.01" name="montant" defaultValue={currentFrais?.montant} required />
                        </Form.Group>
                        <Button variant="primary" type="submit">Enregistrer</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Frais;
