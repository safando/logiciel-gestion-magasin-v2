import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const Stock = () => {
    const [produits, setProduits] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentProduit, setCurrentProduit] = useState(null);

    useEffect(() => {
        fetchProduits();
    }, []);

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
        setCurrentProduit(null);
    };

    const handleShow = (produit = null) => {
        setCurrentProduit(produit);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`/api/produits/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Produit supprimé avec succès.");
                fetchProduits();
            } catch (error) {
                toast.error("Erreur lors de la suppression du produit.");
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const data = {
            nom: e.target.nom.value,
            prix_achat: parseFloat(e.target.prix_achat.value),
            prix_vente: parseFloat(e.target.prix_vente.value),
            quantite: parseInt(e.target.quantite.value),
        };

        try {
            if (currentProduit) {
                if (currentProduit) {
                await axios.put(`/api/produits/${currentProduit.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Produit mis à jour avec succès.");
            } else {
                await axios.post('/api/produits', data, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Produit ajouté avec succès.");
            }
            fetchProduits();
            handleClose();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement du produit.");
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Stock</h2>
                <Button variant="primary" onClick={() => handleShow()}>Ajouter un produit</Button>
            </div>

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Prix d'achat</th>
                        <th>Prix de vente</th>
                        <th>Quantité</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {produits.map(p => (
                        <tr key={p.id}>
                            <td>{p.nom}</td>
                            <td>{p.prix_achat.toFixed(2)} XOF</td>
                            <td>{p.prix_vente.toFixed(2)} XOF</td>
                            <td>{p.quantite}</td>
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
                    <Modal.Title>{currentProduit ? 'Modifier' : 'Ajouter'} un produit</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSave}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nom</Form.Label>
                            <Form.Control type="text" name="nom" defaultValue={currentProduit?.nom} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Prix d'achat</Form.Label>
                            <Form.Control type="number" step="0.01" name="prix_achat" defaultValue={currentProduit?.prix_achat} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Prix de vente</Form.Label>
                            <Form.Control type="number" step="0.01" name="prix_vente" defaultValue={currentProduit?.prix_vente} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Quantité</Form.Label>
                            <Form.Control type="number" name="quantite" defaultValue={currentProduit?.quantite} required />
                        </Form.Group>
                        <Button variant="primary" type="submit">Enregistrer</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Stock;
