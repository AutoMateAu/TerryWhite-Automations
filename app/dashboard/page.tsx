import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, CreditCard, HelpCircle, User2, Bell, ArrowUp, ArrowDown } from "lucide-react" // Import Bell icon and new arrows
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const NotificationCard = ({
  title,
  description,
  time,
}: {
  title: string
  description: string
  time: string
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <HelpCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex items-start gap-2">
        {" "}
        {/* Added flex and gap */}
        <div className="w-2 h-2 bg-purple-600 rounded-full mt-1" /> {/* Purple dot */}
        <div>
          <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="container py-10">
      <div className="grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <User2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">45,231</div>
              <p className="text-sm text-purple-600 flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                {"+20.1% from last month"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">$250,000</div>
              <p className="text-sm text-purple-600 flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                {"+12% from last month"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">12</div>
              <p className="text-sm text-purple-600 flex items-center">
                <ArrowDown className="h-4 w-4 mr-1" />
                {"-5% from last month"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-purple-50 rounded-xl p-4">
            {" "}
            {/* Added background tint */}
            <CardHeader>
              <CardTitle>Your Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full space-y-2">
                <NotificationCard
                  title="Appointment Reminder"
                  description="Reminder for patient John Doe's appointment tomorrow at 10:00 AM."
                  time="5 minutes ago"
                />
                <NotificationCard
                  title="Lab Results Ready"
                  description="Lab results for patient Jane Smith are now available."
                  time="30 minutes ago"
                />
                <NotificationCard
                  title="New Patient Registration"
                  description="New patient record created for Michael Johnson."
                  time="1 hour ago"
                />
                <NotificationCard
                  title="Appointment Reminder"
                  description="Reminder for patient John Doe's appointment tomorrow at 10:00 AM."
                  time="5 minutes ago"
                />
                <NotificationCard
                  title="Lab Results Ready"
                  description="Lab results for patient Jane Smith are now available."
                  time="30 minutes ago"
                />
                <NotificationCard
                  title="New Patient Registration"
                  description="New patient record created for Michael Johnson."
                  time="1 hour ago"
                />
              </ScrollArea>
              <div className="mt-4">
                <Button variant="outline">View All</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="border-b-2 border-purple-600 inline-block pb-1">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full space-y-2">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" /> {/* Purple dot */}
                  <div>
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-muted-foreground">$150 - Consultation</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" /> {/* Purple dot */}
                  <div>
                    <p className="text-sm font-medium">Jane Smith</p>
                    <p className="text-xs text-muted-foreground">$200 - Lab Tests</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" /> {/* Purple dot */}
                  <div>
                    <p className="text-sm font-medium">Michael Johnson</p>
                    <p className="text-xs text-muted-foreground">$100 - Follow-up</p>
                  </div>
                </div>
              </ScrollArea>
              <div className="mt-4">
                <Button variant="outline">View All</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="border-b-2 border-purple-600 inline-block pb-1">Outstanding Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full space-y-2">
                <Alert className="bg-purple-100 text-purple-600 font-semibold px-2 py-1 rounded-md">
                  <AlertTitle>Overdue!</AlertTitle>
                  <AlertDescription>Patient appointment with John Doe is overdue.</AlertDescription>
                </Alert>
                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Reminder
                  </AlertTitle>
                  <AlertDescription>Follow up with patient Jane Smith regarding lab results.</AlertDescription>
                </Alert>
                <Alert className="bg-purple-100 text-purple-600 font-semibold px-2 py-1 rounded-md">
                  <AlertTitle>Overdue!</AlertTitle>
                  <AlertDescription>Patient appointment with John Doe is overdue.</AlertDescription>
                </Alert>
              </ScrollArea>
              <div className="mt-4">
                <Button variant="outline">View All</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="border-b-2 border-purple-600 inline-block pb-1">Outstanding Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full space-y-2">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-muted-foreground">$500 - Unpaid balance</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-medium">Jane Smith</p>
                    <p className="text-xs text-muted-foreground">$300 - Unpaid balance</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-medium">Michael Johnson</p>
                    <p className="text-xs text-muted-foreground">$200 - Unpaid balance</p>
                  </div>
                </div>
              </ScrollArea>
              <div className="mt-4">
                <Button variant="outline">View All</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
