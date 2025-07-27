import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, func, Table
from sqlalchemy.orm import sessionmaker, relationship, declarative_base, Session, joinedload
from contextlib import contextmanager
from datetime import datetime, timezone, date
from passlib.context import CryptContext

# ==============================================================================
# CONFIGURATION ET MOTEUR DE LA BASE DE DONNÉES
# ==============================================================================

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./magasin_v2.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

# ==============================================================================
# MODÈLES DE TABLES (SQLAlchemy ORM)
# ==============================================================================

user_roles = Table('user_roles', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    roles = relationship("Role", secondary=user_roles, back_populates="users")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    users = relationship("User", secondary=user_roles, back_populates="roles")

class Produit(Base):
    __tablename__ = "produits"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, unique=True, nullable=False, index=True)
    prix_achat = Column(Float, nullable=False)
    prix_vente = Column(Float, nullable=False)
    quantite = Column(Integer, nullable=False)
    
    ventes = relationship("Vente", back_populates="produit")
    pertes = relationship("Perte", back_populates="produit")
    frais_annexes = relationship("FraisAnnexe", back_populates="produit")

class Vente(Base):
    __tablename__ = "ventes"
    id = Column(Integer, primary_key=True, index=True)
    produit_id = Column(Integer, ForeignKey("produits.id"), nullable=False)
    quantite = Column(Integer, nullable=False)
    prix_total = Column(Float, nullable=False)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    produit = relationship("Produit", back_populates="ventes")
    user = relationship("User")

class Perte(Base):
    __tablename__ = "pertes"
    id = Column(Integer, primary_key=True, index=True)
    produit_id = Column(Integer, ForeignKey("produits.id"), nullable=False)
    quantite = Column(Integer, nullable=False)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    produit = relationship("Produit", back_populates="pertes")
    user = relationship("User")

class FraisAnnexe(Base):
    __tablename__ = "frais_annexes"
    id = Column(Integer, primary_key=True, index=True)
    produit_id = Column(Integer, ForeignKey("produits.id"), nullable=False)
    description = Column(String, nullable=False)
    montant = Column(Float, nullable=False)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    produit = relationship("Produit", back_populates="frais_annexes")
    user = relationship("User")

# ==============================================================================
# FONCTIONS UTILITAIRES
# ==============================================================================

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_db_and_tables():
    Base.metadata.create_all(bind=engine)
    with get_db() as db:
        if not db.query(Role).count():
            db.add(Role(name="admin"))
            db.add(Role(name="manager"))
            db.add(Role(name="employee"))
            db.commit()
        if not db.query(User).count():
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            admin_user = User(
                username="admin",
                email="admin@example.com",
                hashed_password=pwd_context.hash("adminpassword")
            )
            admin_user.roles.append(admin_role)
            db.add(admin_user)
            db.commit()

# ==============================================================================
# LOGIQUE MÉTIER
# ==============================================================================

def get_user_by_username(db: Session, username: str):
    return db.query(User).options(joinedload(User.roles)).filter(User.username == username).first()

def get_all_users(db: Session):
    return db.query(User).options(joinedload(User.roles)).all()

def get_all_roles(db: Session):
    return db.query(Role).all()

def create_user(db: Session, user_data: dict):
    hashed_password = pwd_context.hash(user_data['password'])
    db_user = User(username=user_data['username'], email=user_data['email'], hashed_password=hashed_password)
    
    role_names = user_data.get('roles', [])
    roles = db.query(Role).filter(Role.name.in_(role_names)).all()
    db_user.roles.extend(roles)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_data: dict):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    if 'password' in user_data and user_data['password']:
        user.hashed_password = pwd_context.hash(user_data['password'])
    
    if 'roles' in user_data:
        role_names = user_data['roles']
        roles = db.query(Role).filter(Role.name.in_(role_names)).all()
        user.roles = roles

    user.username = user_data.get('username', user.username)
    user.email = user_data.get('email', user.email)
    
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

def get_all_produits(db: Session):
    return db.query(Produit).order_by(Produit.nom).all()

def get_all_ventes(db: Session):
    return db.query(Vente).options(joinedload(Vente.produit)).order_by(Vente.date.desc()).all()

def add_vente(db: Session, user_id: int, produit_id: int, quantite: int):
    produit = db.query(Produit).filter(Produit.id == produit_id).first()
    if not produit or produit.quantite < quantite:
        raise ValueError("Stock insuffisant ou produit non trouvé.")
    
    produit.quantite -= quantite
    nouvelle_vente = Vente(
        produit_id=produit_id, 
        quantite=quantite, 
        prix_total=produit.prix_vente * quantite,
        user_id=user_id
    )
    db.add(nouvelle_vente)
    db.commit()
    db.refresh(nouvelle_vente)
    return nouvelle_vente

def update_vente(db: Session, vente_id: int, produit_id: int, quantite: int):
    vente = db.query(Vente).filter(Vente.id == vente_id).first()
    if not vente:
        raise ValueError("Vente non trouvée.")

    ancien_produit = db.query(Produit).filter(Produit.id == vente.produit_id).first()
    ancien_produit.quantite += vente.quantite

    nouveau_produit = db.query(Produit).filter(Produit.id == produit_id).first()
    if not nouveau_produit or nouveau_produit.quantite < quantite:
        raise ValueError("Stock insuffisant ou produit non trouvé pour la mise à jour.")
    
    nouveau_produit.quantite -= quantite

    vente.produit_id = produit_id
    vente.quantite = quantite
    vente.prix_total = nouveau_produit.prix_vente * quantite
    db.commit()
    db.refresh(vente)
    return vente

def delete_vente(db: Session, vente_id: int):
    vente = db.query(Vente).filter(Vente.id == vente_id).first()
    if vente:
        produit = vente.produit
        produit.quantite += vente.quantite
        db.delete(vente)
        db.commit()
        return True
    return False

def get_all_pertes(db: Session):
    return db.query(Perte).options(joinedload(Perte.produit)).order_by(Perte.date.desc()).all()

def add_perte(db: Session, user_id: int, produit_id: int, quantite: int):
    produit = db.query(Produit).filter(Produit.id == produit_id).first()
    if not produit or produit.quantite < quantite:
        raise ValueError("Stock insuffisant ou produit non trouvé.")
    
    produit.quantite -= quantite
    nouvelle_perte = Perte(
        produit_id=produit_id, 
        quantite=quantite,
        user_id=user_id
    )
    db.add(nouvelle_perte)
    db.commit()
    db.refresh(nouvelle_perte)
    return nouvelle_perte

def update_perte(db: Session, perte_id: int, produit_id: int, quantite: int):
    perte = db.query(Perte).filter(Perte.id == perte_id).first()
    if not perte:
        raise ValueError("Perte non trouvée.")

    ancien_produit = db.query(Produit).filter(Produit.id == perte.produit_id).first()
    ancien_produit.quantite += perte.quantite

    nouveau_produit = db.query(Produit).filter(Produit.id == produit_id).first()
    if not nouveau_produit or nouveau_produit.quantite < quantite:
        raise ValueError("Stock insuffisant ou produit non trouvé pour la mise à jour.")
    
    nouveau_produit.quantite -= quantite

    perte.produit_id = produit_id
    perte.quantite = quantite
    db.commit()
    db.refresh(perte)
    return perte

def delete_perte(db: Session, perte_id: int):
    perte = db.query(Perte).filter(Perte.id == perte_id).first()
    if perte:
        produit = perte.produit
        produit.quantite += perte.quantite
        db.delete(perte)
        db.commit()
        return True
    return False

def get_all_frais(db: Session):
    return db.query(FraisAnnexe).options(joinedload(FraisAnnexe.produit)).order_by(FraisAnnexe.date.desc()).all()

def add_frais(db: Session, user_id: int, produit_id: int, description: str, montant: float):
    nouveau_frais = FraisAnnexe(
        produit_id=produit_id,
        description=description,
        montant=montant,
        user_id=user_id
    )
    db.add(nouveau_frais)
    db.commit()
    db.refresh(nouveau_frais)
    return nouveau_frais

def update_frais(db: Session, frais_id: int, produit_id: int, description: str, montant: float):
    frais = db.query(FraisAnnexe).filter(FraisAnnexe.id == frais_id).first()
    if not frais:
        raise ValueError("Frais non trouvé.")

    frais.produit_id = produit_id
    frais.description = description
    frais.montant = montant
    db.commit()
    db.refresh(frais)
    return frais

def delete_frais(db: Session, frais_id: int):
    frais = db.query(FraisAnnexe).filter(FraisAnnexe.id == frais_id).first()
    if frais:
        db.delete(frais)
        db.commit()
        return True
    return False

def get_analyse_financiere(db: Session, start_date_str: str, end_date_str: str):
    start_date = datetime.fromisoformat(start_date_str)
    end_date = datetime.fromisoformat(end_date_str)

    chiffre_affaires = db.query(func.sum(Vente.prix_total)).filter(Vente.date >= start_date, Vente.date <= end_date).scalar() or 0
    cogs = db.query(func.sum(Produit.prix_achat * Vente.quantite)).select_from(Vente).join(Produit).filter(Vente.date >= start_date, Vente.date <= end_date).scalar() or 0
    benefice_brut = chiffre_affaires - cogs

    depenses = db.query(func.sum(FraisAnnexe.montant)).filter(FraisAnnexe.date >= start_date, FraisAnnexe.date <= end_date).scalar() or 0
    benefice_net = benefice_brut - depenses

    graph_data_query = db.query(func.date(Vente.date).label('jour'), func.sum(Vente.prix_total).label('ca_jour')).filter(Vente.date >= start_date, Vente.date <= end_date).group_by(func.date(Vente.date)).order_by(func.date(Vente.date))
    graph_data = graph_data_query.all()

    top_profitable_query = db.query(
        Produit.nom,
        func.sum((Vente.prix_total) - (Produit.prix_achat * Vente.quantite)).label('total_profit')
    ).join(Produit, Vente.produit_id == Produit.id).filter(Vente.date >= start_date, Vente.date <= end_date).group_by(Produit.nom).order_by(func.sum((Vente.prix_total) - (Produit.prix_achat * Vente.quantite)).desc()).limit(5)
    top_profitable_products = top_profitable_query.all()

    top_lost_query = db.query(
        Produit.nom,
        func.sum(Perte.quantite).label('total_lost')
    ).join(Produit, Perte.produit_id == Produit.id).filter(Perte.date >= start_date, Perte.date <= end_date).group_by(Produit.nom).order_by(func.sum(Perte.quantite).desc()).limit(5)
    top_lost_products = top_lost_query.all()

    return {
        "chiffre_affaires": chiffre_affaires,
        "cogs": cogs,
        "benefice": benefice_brut,
        "depenses": depenses,
        "benefice_net": benefice_net,
        "graph_data": [{"jour": r.jour.isoformat(), "ca_jour": r.ca_jour} for r in graph_data],
        "top_profitable_products": [dict(r._mapping) for r in top_profitable_products],
        "top_lost_products": [dict(r._mapping) for r in top_lost_products]
    }

def get_dashboard_kpis(db: Session):
    today = date.today()
    ca_today = db.query(func.sum(Vente.prix_total)).filter(func.date(Vente.date) == today).scalar() or 0
    ventes_today = db.query(func.sum(Vente.quantite)).filter(func.date(Vente.date) == today).scalar() or 0
    total_stock_quantite = db.query(func.sum(Produit.quantite)).scalar() or 0
    total_stock_valeur = db.query(func.sum(Produit.quantite * Produit.prix_achat)).scalar() or 0
    top_ventes_today = db.query(Produit.nom, func.sum(Vente.quantite).label('quantite_vendue')).join(Vente).filter(func.date(Vente.date) == today).group_by(Produit.nom).order_by(func.sum(Vente.quantite).desc()).limit(5).all()
    low_stock_produits = db.query(Produit).filter(Produit.quantite < 10).order_by(Produit.quantite).limit(5).all()

    return {
        "ca_today": ca_today,
        "ventes_today": ventes_today,
        "total_stock_quantite": total_stock_quantite,
        "total_stock_valeur": total_stock_valeur,
        "top_ventes_today": [dict(r._mapping) for r in top_ventes_today],
        "low_stock_produits": [p for p in low_stock_produits]
    }
