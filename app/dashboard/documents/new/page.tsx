import { PageHeader } from "@/components/dashboard/page-header";
import { DocumentUploader } from "@/components/documents/document-uploader";

export const metadata = { title: "Document Summarizer" };

export default function NewDocumentPage() {
  return (
    <>
      <PageHeader
        title="Document Summarizer"
        description="Upload a PDF, DOCX, or TXT — or paste text — to get an instant AI summary."
      />
      <DocumentUploader />
    </>
  );
}
