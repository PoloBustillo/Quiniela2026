import { redirect } from "next/navigation";

// /predictions is not linked — all prediction functionality lives at /
export default function PredictionsPage() {
  redirect("/");
}
