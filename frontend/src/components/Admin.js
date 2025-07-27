import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
            setUsers(response.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des utilisateurs.");
        }
    };

    const fetchRoles = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/roles', { headers: { Authorization: `Bearer ${token}` } });
            setRoles(response.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des rôles.");
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setCurrentUser(null);
    };

    const handleShow = (user = null) => {
        setCurrentUser(user);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Utilisateur supprimé avec succès.");
                fetchUsers();
            } catch (error) {
                toast.error("Erreur lors de la suppression de l'utilisateur.");
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const data = {
            username: e.target.username.value,
            email: e.target.email.value,
            password: e.target.password.value,
            roles: Array.from(e.target.roles.options).filter(o => o.selected).map(o => o.value)
        };

        try {
            if (currentUser) {
                await axios.put(`/api/users/${currentUser.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Utilisateur mis à jour avec succès.");
            } else {
                await axios.post('/api/users', data, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Utilisateur ajouté avec succès.");
            }
            fetchUsers();
            handleClose();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement de l'utilisateur.");
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Gestion des utilisateurs</h2>
                <Button variant="primary" onClick={() => handleShow()}>Ajouter un utilisateur</Button>
            </div>

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Nom d'utilisateur</th>
                        <th>Email</th>
                        <th>Rôles</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td>{u.roles.map(r => r.name).join(', ')}</td>
                            <td>
                                <Button variant="warning" size="sm" onClick={() => handleShow(u)}><i className="fas fa-pencil-alt"></i></Button>
                                <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDelete(u.id)}><i className="fas fa-trash"></i></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{currentUser ? 'Modifier' : 'Ajouter'} un utilisateur</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSave}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nom d'utilisateur</Form.Label>
                            <Form.Control type="text" name="username" defaultValue={currentUser?.username} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" name="email" defaultValue={currentUser?.email} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mot de passe</Form.Label>
                            <Form.Control type="password" name="password" required={!currentUser} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Rôles</Form.Label>
                            <Form.Select multiple name="roles" defaultValue={currentUser?.roles.map(r => r.name)} required>
                                {roles.map(r => (
                                    <option key={r.id} value={r.name}>{r.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Button variant="primary" type="submit">Enregistrer</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Admin;
