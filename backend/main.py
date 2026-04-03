from fastapi import FastAPI, Depends, HTTPException, Response as FastAPIResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas
from database import SessionLocal, engine
import csv
import io

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zealflow Core Backend API")

# Allow requests from the pip package / frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/forms", response_model=schemas.FormResponse)
def create_form(form: schemas.FormCreate, db: Session = Depends(get_db)):
    db_form = models.Form(title=form.title, schema_data=form.schema_data)
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    return db_form

@app.get("/forms/{form_id}", response_model=schemas.FormResponse)
def read_form(form_id: str, db: Session = Depends(get_db)):
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form

@app.post("/forms/{form_id}/responses", response_model=schemas.SubmissionResponse)
def submit_response(form_id: str, submission: schemas.SubmissionCreate, db: Session = Depends(get_db)):
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    
    db_response = models.Response(form_id=form_id, answers=submission.answers)
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    return db_response

@app.get("/forms/{form_id}/responses/csv")
def export_responses_csv(form_id: str, db: Session = Depends(get_db)):
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    
    responses = db.query(models.Response).filter(models.Response.form_id == form_id).all()
    
    if not responses:
        raise HTTPException(status_code=404, detail="No responses found for this form")

    # Compile a unique matrix of all possible fields answered organically
    all_keys = set()
    for resp in responses:
        all_keys.update(resp.answers.keys())
    
    header = ["response_id", "submitted_at"] + list(all_keys)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(header)
    
    for resp in responses:
        row = [resp.id, resp.submitted_at.isoformat()]
        for key in all_keys:
            row.append(str(resp.answers.get(key, "")))
        writer.writerow(row)
    
    return FastAPIResponse(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=form_{form_id}_responses.csv"}
    )
