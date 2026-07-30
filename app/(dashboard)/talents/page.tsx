import Link from "next/link";

export default function TalentsPage() {
  return (
    <div>
      <h1>Talente</h1>
      <Link href="/talents/new">+ Neues Talent</Link>
    </div>
  );
}
