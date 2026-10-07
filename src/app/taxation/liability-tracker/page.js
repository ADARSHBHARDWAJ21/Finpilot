import TaxPage from "@/components/taxation/TaxPage";
export default function Page({ searchParams }) {
  return <TaxPage mode="liability" searchParams={searchParams} />;
}
