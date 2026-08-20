interface DocumentSource {
  documentId: number;
  url: string | null;
  fileRef: string | null;
}

/** Tài liệu local chỉ được mở qua endpoint đã kiểm tra đường dẫn của Backend. */
export function publicDocumentUrl(document: DocumentSource): string | null {
  return document.fileRef?.trim()
    ? `/api/v1/documents/${document.documentId}/file`
    : document.url?.trim() || null;
}
