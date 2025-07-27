
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import database as db

# ==============================================================================
# CONFIGURATION DE LA SÉCURITÉ
# ==============================================================================

# Clé secrète pour signer les tokens JWT. En production, utilisez une clé forte et gardez-la secrète.
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_that_should_be_in_env_vars")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Contexte pour le hachage des mots de passe
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

# Schéma OAuth2 pour que FastAPI sache comment trouver le token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# ==============================================================================
# FONCTIONS DE VÉRIFICATION ET DE CRÉATION
# ==============================================================================

def verify_password(plain_password, hashed_password):
    """Vérifie si un mot de passe en clair correspond au mot de passe haché."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crée un nouveau token d'accès JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ==============================================================================
# LOGIQUE D'AUTHENTIFICATION PRINCIPALE
# ==============================================================================

def authenticate_user(db_session: Session, username: str, password: str):
    """
    Authentifie un utilisateur. Retourne l'objet User si l'authentification réussit,
    sinon None.
    """
    user = db.get_user_by_username(db_session, username=username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db_session: Session = Depends(db.get_db)):
    """
    Décode le token JWT pour obtenir l'utilisateur actuel. C'est une dépendance
    qui sera utilisée dans les endpoints protégés.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les informations d'identification",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.get_user_by_username(db_session, username=username)
    if user is None:
        raise credentials_exception
    return user
