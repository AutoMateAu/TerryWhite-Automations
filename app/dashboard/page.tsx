"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageSquare, CalendarCheck, AlertTriangle } from "lucide-react"
import type { NotificationItem, TaskItem } from "@/lib/types"
import { mockNotifications, mockTasks, mockSalesData } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { SalesChart } from "@/components/sales-chart"

export default function DashboardPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])

  useEffect(() => {
    // In a real app, fetch this data
    setNotifications(
      mockNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    )
    setTasks(mockTasks)
  }, [])

  const toggleNotificationCompletion = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isCompleted: !n.isCompleted } : n)))
  }

  const toggleTaskCompletion = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)))
  }

  const getIcon = (type: "message" | "reminder") => {
    if (type === "message") return <MessageSquare className="h-5 w-5 text-blue-500" />
    return <CalendarCheck className="h-5 w-5 text-green-500" />
  }

  const getRelativeTime = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    }

    for (const [intervalName, secondsInInterval] of Object.entries(intervals)) {
      const intervalCount = Math.floor(diffInSeconds / secondsInInterval)
      if (intervalCount >= 1) {
        return `${intervalCount} ${intervalName}${intervalCount > 1 ? "s" : ""} ago`
      }
    }
    return "just now"
  }

  return (
    <div className="container mx-auto py-8 space-y-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-900 rounded-xl">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={mockSalesData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accounting Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">YTD</p>
                <p className="text-2xl font-bold">$120k</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold">$8.2k</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.isCompleted}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className={`text-sm ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Notifications</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notifications.length === 0 && <p>No new notifications or messages.</p>}
          {notifications.map((item) => (
            <Card key={item.id} className={item.isCompleted ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getIcon(item.type)}
                    {item.title}
                  </CardTitle>
                  {item.type === "reminder" &&
                    item.dueDate &&
                    !item.isCompleted &&
                    new Date(item.dueDate) < new Date() && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Overdue
                      </Badge>
                    )}
                </div>
                <CardDescription>
                  {item.type === "reminder" && item.dueDate
                    ? `Due: ${new Date(item.dueDate).toLocaleDateString()}`
                    : `Received: ${getRelativeTime(item.timestamp)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.content}</p>
              </CardContent>
              {item.type === "reminder" && (
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`complete-${item.id}`}
                      checked={item.isCompleted}
                      onCheckedChange={() => toggleNotificationCompletion(item.id)}
                    />
                    <label
                      htmlFor={`complete-${item.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as completed
                    </label>
                  </div>
                  {item.isCompleted && <Badge variant="secondary">Completed</Badge>}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
