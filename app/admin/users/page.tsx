import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getUserSessionAndProfile, getUsersWithProfiles, updateUserRoleAndHospital } from "@/lib/auth"
import { getHospitals } from "@/lib/hospitals"
import { redirect } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export default async function AdminUsersPage() {
  const { session, profile, error: authError } = await getUserSessionAndProfile()

  if (authError || !session || profile?.role !== "admin") {
    redirect("/dashboard") // Redirect if not authenticated or not an admin
  }

  const { users, error: usersError } = await getUsersWithProfiles()
  const { hospitals, error: hospitalsError } = await getHospitals()

  if (usersError || hospitalsError) {
    return <div className="p-4 text-red-500">Error loading data: {usersError || hospitalsError}</div>
  }

  const handleUpdateRoleAndHospital = async (formData: FormData) => {
    "use server"
    const result = await updateUserRoleAndHospital(formData)
    if (!result.success) {
      console.error("Failed to update user:", result.message)
      // In a real app, you'd want to show a toast or error message to the admin
    }
    redirect("/admin/users") // Revalidate data
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">User Management</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user roles and hospital affiliations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Current Hospital</TableHead>
                <TableHead>New Role</TableHead>
                <TableHead>New Hospital</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.profile?.role || "N/A"}</TableCell>
                  <TableCell>{user.profile?.hospital_name || "N/A"}</TableCell>
                  <TableCell>
                    <form action={handleUpdateRoleAndHospital} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <Select name="role" defaultValue={user.profile?.role || "nurse"}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                        </SelectContent>
                      </Select>
                    </form>
                  </TableCell>
                  <TableCell>
                    <form action={handleUpdateRoleAndHospital} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <Select name="hospitalId" defaultValue={user.profile?.hospital_id || "null"}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Hospital" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">No Hospital</SelectItem>
                          {hospitals?.map((hospital) => (
                            <SelectItem key={hospital.id} value={hospital.id}>
                              {hospital.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </form>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={handleUpdateRoleAndHospital}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="role" value={user.profile?.role || "nurse"} />
                      <input type="hidden" name="hospitalId" value={user.profile?.hospital_id || "null"} />
                      <Button type="submit" size="sm">
                        Update
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
