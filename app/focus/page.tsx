import { FocusView } from "@/components/focus-view";

export default async function FocusPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const task = typeof params.task === "string" ? params.task : null;
  return <FocusView taskId={task} />;
}
