import type { Metadata } from "next"
import { TasksList } from "@/features/nursing/components/tasks-list"

export const metadata: Metadata = { title: "Nursing Tasks" }

export default function NursingTasksPage() {
  return <TasksList />
}
