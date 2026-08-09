from sqlalchemy.orm import Session, sessionmaker

from backend.app.db.database import engine


SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    expire_on_commit=False,
)


def get_db():
    with SessionLocal() as session:
        yield session