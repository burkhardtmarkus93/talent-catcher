"use client";

import React from "react";

type DocumentItem = {
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
};

const documents: DocumentItem[] = [
  {
    title: "Koordinationstest – Tests und Bewertung",
    description:
      "Word-Datei mit allen Koordinationstests, Punkteskala 0–3, Info-Icon-Texten und Bild-Skizzen.",
    fileUrl: "https://dziovesybrqumwygchdp.supabase.co/storage/v1/object/sign/documents/koordinationstest_tests_mit_skizzen.docx?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTY4N2NkZS1iNmJmLTRhNzUtOWE0My02YWQzNTcxZGFiMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMva29vcmRpbmF0aW9uc3Rlc3RfdGVzdHNfbWl0X3NraXp6ZW4uZG9jeCIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODU2Mjc3MzYsImV4cCI6NDkzOTIyNzczNn0.I694ESQ_gUIZL16PadqDFkwjWHFddrcgk42K67XRabA",
    fileType: "DOCX",
  },
];

export default function DokumentePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Dokumente</h1>
        <p className="mt-2 text-gray-600">
          Hier findest du verfügbare Word-Dateien und kannst sie direkt herunterladen.
        </p>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.title}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-900">{doc.title}</h2>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {doc.fileType}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{doc.description}</p>
              </div>

              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
              >
                Word-Datei herunterladen
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
