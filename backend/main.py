from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from . import database as db
from . import auth

# ==============================================================================
# INITIALISATION DE L'APPLICATION
# ==============================================================================

db.create_db_and_tables()

app = FastAPI(
    title="API de Gestion de Magasin V2",
    description="Une API sécurisée pour la gestion de magasin avec authentification et gestion des rôles.",
    version="2.0.0"
)

# ==============================================================================
# SCHÉMAS PYDANTIC (Validation des données)
# ==============================================================================

class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str
    roles: List[str] = []

class UserUpdate(UserBase):
    password: Optional[str] = None
    roles: List[str] = []

class User(UserBase):
    id: int
    roles: List[Role] = []
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ProduitBase(BaseModel):
    nom: str
    prix_achat: float
    prix_vente: float
    quantite: int

class Produit(ProduitBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class VenteBase(BaseModel):
    produit_id: int
    quantite: int

class VenteCreate(VenteBase):
    pass

class Vente(VenteBase):
    id: int
    prix_total: float
    date: datetime
    produit: Produit
    model_config = ConfigDict(from_attributes=True)

class PerteBase(BaseModel):
    produit_id: int
    quantite: int

class PerteCreate(PerteBase):
    pass

class Perte(PerteBase):
    id: int
    date: datetime
    produit: Produit
    model_config = ConfigDict(from_attributes=True)

class FraisAnnexeBase(BaseModel):
    produit_id: int
    description: str
    montant: float

class FraisAnnexeCreate(FraisAnnexeBase):
    pass

class FraisAnnexe(FraisAnnexeBase):
    id: int
    date: datetime
    produit: Produit
    model_config = ConfigDict(from_attributes=True)

class AnalyseData(BaseModel):
    chiffre_affaires: float
    cogs: float
    benefice: float
    depenses: float
    benefice_net: float
    graph_data: List[dict]
    top_profitable_products: List[dict]
    top_lost_products: List[dict]

class DashboardData(BaseModel):
    ca_today: float
    ventes_today: int
    total_stock_quantite: int
    total_stock_valeur: float
    top_ventes_today: List[dict]
    low_stock_produits: List[Produit]

# ==============================================================================
# DÉPENDANCES (Injection et Sécurité)
# ==============================================================================

def get_db_session():
    with db.get_db() as session:
        yield session

async def get_current_user(token: str = Depends(auth.oauth2_scheme), db_session: Session = Depends(get_db_session)):
    return auth.get_current_user(token, db_session)

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user

def require_role(role_name: str):
    async def role_checker(current_user: User = Depends(get_current_active_user)):
        if not any(role.name == role_name for role in current_user.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accès refusé. Rôle '{role_name}' requis."
            )
        return current_user
    return role_checker

# ==============================================================================
# ENDPOINTS D'AUTHENTIFICATION
# ==============================================================================

@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db_session: Session = Depends(get_db_session)):
    user = auth.authenticate_user(db_session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nom d'utilisateur ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# ==============================================================================
# ENDPOINTS DE GESTION (Protégés par rôle)
# ==============================================================================

@app.get("/api/users", response_model=List[User], dependencies=[Depends(require_role('admin'))])
async def get_users(db_session: Session = Depends(get_db_session)):
    return db.get_all_users(db_session)

@app.get("/api/roles", response_model=List[Role], dependencies=[Depends(require_role('admin'))])
async def get_roles(db_session: Session = Depends(get_db_session)):
    return db.get_all_roles(db_session)

@app.post("/api/users", response_model=User, dependencies=[Depends(require_role('admin'))])
async def create_user(user: UserCreate, db_session: Session = Depends(get_db_session)):
    db_user = db.get_user_by_username(db_session, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur existe déjà")
    return db.create_user(db=db_session, user_data=user.model_dump())

@app.put("/api/users/{user_id}", response_model=User, dependencies=[Depends(require_role('admin'))])
async def update_user(user_id: int, user: UserUpdate, db_session: Session = Depends(get_db_session)):
    return db.update_user(db=db_session, user_id=user_id, user_data=user.model_dump())

@app.delete("/api/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role('admin'))])
async def delete_user(user_id: int, db_session: Session = Depends(get_db_session)):
    deleted = db.delete_user(db=db_session, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return

# ==============================================================================
# ENDPOINTS DE L'APPLICATION
# ==============================================================================

@app.get("/api/produits", response_model=List[Produit], dependencies=[Depends(get_current_active_user)])
async def api_get_produits(db_session: Session = Depends(get_db_session)):
    return db.get_all_produits(db_session)

@app.get("/api/ventes", response_model=List[Vente], dependencies=[Depends(get_current_active_user)])
async def api_get_ventes(db_session: Session = Depends(get_db_session)):
    return db.get_all_ventes(db_session)

@app.post("/api/ventes", response_model=Vente, dependencies=[Depends(get_current_active_user)])
async def api_add_vente(vente: VenteCreate, db_session: Session = Depends(get_db_session), current_user: User = Depends(get_current_active_user)):
    try:
        return db.add_vente(db_session, user_id=current_user.id, **vente.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/ventes/{vente_id}", response_model=Vente, dependencies=[Depends(require_role('manager'))])
async def api_update_vente(vente_id: int, vente: VenteCreate, db_session: Session = Depends(get_db_session)):
    try:
        return db.update_vente(db_session, vente_id, **vente.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/ventes/{vente_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role('admin'))])
async def api_delete_vente(vente_id: int, db_session: Session = Depends(get_db_session)):
    deleted = db.delete_vente(db_session, vente_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    return

@app.get("/api/pertes", response_model=List[Perte], dependencies=[Depends(get_current_active_user)])
async def api_get_pertes(db_session: Session = Depends(get_db_session)):
    return db.get_all_pertes(db_session)

@app.post("/api/pertes", response_model=Perte, dependencies=[Depends(get_current_active_user)])
async def api_add_perte(perte: PerteCreate, db_session: Session = Depends(get_db_session), current_user: User = Depends(get_current_active_user)):
    try:
        return db.add_perte(db_session, user_id=current_user.id, **perte.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/pertes/{perte_id}", response_model=Perte, dependencies=[Depends(require_role('manager'))])
async def api_update_perte(perte_id: int, perte: PerteCreate, db_session: Session = Depends(get_db_session)):
    try:
        return db.update_perte(db_session, perte_id, **perte.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/pertes/{perte_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role('admin'))])
async def api_delete_perte(perte_id: int, db_session: Session = Depends(get_db_session)):
    deleted = db.delete_perte(db_session, perte_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Perte non trouvée")
    return

@app.get("/api/frais", response_model=List[FraisAnnexe], dependencies=[Depends(get_current_active_user)])
async def api_get_frais(db_session: Session = Depends(get_db_session)):
    return db.get_all_frais(db_session)

@app.post("/api/frais", response_model=FraisAnnexe, dependencies=[Depends(get_current_active_user)])
async def api_add_frais(frais: FraisAnnexeCreate, db_session: Session = Depends(get_db_session), current_user: User = Depends(get_current_active_user)):
    try:
        return db.add_frais(db_session, user_id=current_user.id, **frais.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/frais/{frais_id}", response_model=FraisAnnexe, dependencies=[Depends(require_role('manager'))])
async def api_update_frais(frais_id: int, frais: FraisAnnexeCreate, db_session: Session = Depends(get_db_session)):
    try:
        return db.update_frais(db_session, frais_id, **frais.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/frais/{frais_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role('admin'))])
async def api_delete_frais(frais_id: int, db_session: Session = Depends(get_db_session)):
    deleted = db.delete_frais(db_session, frais_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Frais non trouvé")
    return

@app.get("/api/analyse", response_model=AnalyseData, dependencies=[Depends(require_role('admin'))])
async def api_get_analyse(start_date: str, end_date: str, db_session: Session = Depends(get_db_session)):
    try:
        start_date_iso = f"{start_date}T00:00:00"
        end_date_iso = f"{end_date}T23:59:59"
        return db.get_analyse_financiere(db_session, start_date_iso, end_date_iso)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {e}")

@app.get("/api/dashboard", response_model=DashboardData, dependencies=[Depends(get_current_active_user)])
async def api_get_dashboard_kpis(db_session: Session = Depends(get_db_session)):
    return db.get_dashboard_kpis(db_session)

# ==============================================================================
# SERVIR L'APPLICATION FRONTEND
# ==============================================================================

app.mount("/static", StaticFiles(directory="../frontend/build/static"), name="static")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_react_app(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc"):
        raise HTTPException(status_code=404)
    return FileResponse("../frontend/build/index.html")
