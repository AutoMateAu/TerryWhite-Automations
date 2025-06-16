import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUserSessionAndProfile, signOut } from "@/lib/auth"
import { getHospitals, updateUserSelectedHospital } from "@/lib/hospitals"
import { redirect } from "next/navigation"

export default async function SelectHospitalPage() {
  const { session, profile, error: authError } = await getUserSessionAndProfile()

  if (authError || !session) {
    redirect("/login")
  }

  if (profile?.role === "admin") {
    redirect("/dashboard") // Admins don't need to select a hospital
  }

  if (profile?.hospital_id) {
    redirect("/dashboard") // Already selected, redirect to dashboard
  }

  const { hospitals, error: hospitalsError } = await getHospitals()

  if (hospitalsError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Error loading hospitals: {hospitalsError}</p>
      </div>
    )
  }

  const handleHospitalSelection = async (formData: FormData) => {
    "use server"
    const result = await updateUserSelectedHospital(formData)
    if (result.success) {
      redirect("/dashboard")
    } else {
      // Handle error, maybe show a toast
      console.error("Failed to update hospital:", result.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select Your Hospital</CardTitle>
          <CardDescription>Please select the hospital you are affiliated with to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleHospitalSelection} className="space-y-4">
            <input type="hidden" name="userId" value={session.user.id} />
            <Select name="hospitalId" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals?.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
          <form action={signOut} className="mt-4">
            <Button variant="outline" className="w-full">
              Logout
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
