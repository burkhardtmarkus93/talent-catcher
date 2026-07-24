alter table public.consent_records
  add constraint fk_consent_records_evidence_document
  foreign key (evidence_document_id)
  references public.documents(id);