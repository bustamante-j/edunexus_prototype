import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, EmptyState } from "../components/ui";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="page-stack">
      <EmptyState
        title="Page not found"
        detail="The requested EduNexus workspace does not exist."
        action={<Button onClick={() => navigate("/")}><ArrowLeft size={17} /> Return to overview</Button>}
      />
    </div>
  );
}

