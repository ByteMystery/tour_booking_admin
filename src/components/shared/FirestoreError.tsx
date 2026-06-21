import { AlertTriangle } from "lucide-react";

interface Props {
  error: string;
}

export function FirestoreError({ error }: Props) {
  return (
    <div className="m-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-red-700">Lỗi kết nối Firestore</p>
        <p className="text-xs text-red-600 mt-0.5">{error}</p>
        <p className="text-xs text-red-500 mt-1">
          Kiểm tra Security Rules tại:{" "}
          <a
            href="https://console.firebase.google.com/project/tripzio-app/firestore/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Firebase Console
          </a>
        </p>
      </div>
    </div>
  );
}
