import { redirect } from "react-router";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  console.log("[LocaleMate] Root loader URL:", request.url);
  console.log("[LocaleMate] shop parameter:", url.searchParams.get("shop"));
  console.log("[LocaleMate] host parameter:", url.searchParams.get("host"));

  if (url.searchParams.get("shop") || url.searchParams.get("host")) {
    return redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

export default function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-slate-950">LocaleMate</h1>
        <p className="mt-2 text-slate-500">
          Open this app from your Shopify admin to get started.
        </p>
      </div>
    </div>
  );
}
