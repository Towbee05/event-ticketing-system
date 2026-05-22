import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/Alert";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function Profile() {
  const { user, refreshMe, setSession, logout } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileImage, setProfileImage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr(null);
    setSavingProfile(true);
    try {
      const updates: Record<string, string> = {};
      if (name !== user?.name) updates.name = name;
      if (email !== user?.email) updates.email = email;
      if (profileImage) updates.profileImage = profileImage;
      if (Object.keys(updates).length === 0) {
        toast.info("Nothing to update");
        return;
      }
      await api("/api/users/me", { method: "PATCH", body: updates });
      await refreshMe();
      toast.success("Profile updated");
      setProfileImage("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update failed";
      setProfileErr(msg);
      toast.error("Update failed", msg);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setSavingPw(true);
    try {
      const data = await api<{
        token: string;
        user: { id: string; name: string; email: string; role: "attendee" | "organizer" | "admin" };
      }>("/api/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
      // Backend issues a fresh token (since passwordChangedAt invalidates the old one).
      setSession(data.token, {
        id: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
      });
      toast.success("Password updated", "You've been issued a fresh session.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Password change failed";
      setPwErr(msg);
      toast.error("Couldn't update password", msg);
    } finally {
      setSavingPw(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Update your details and manage your sign-in."
        actions={<Badge variant="secondary" className="capitalize">{user.role}</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Visible to organizers when you book their events.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Profile image URL (optional)</Label>
              <Input id="image" placeholder="https://…" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} />
            </div>
            {profileErr && <Alert variant="error">{profileErr}</Alert>}
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Existing sessions remain valid; older tokens are invalidated.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <Input id="current" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <Input id="new" type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </div>
            {pwErr && <Alert variant="error">{pwErr}</Alert>}
            <Button type="submit" disabled={savingPw}>
              {savingPw ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Sign out</CardTitle>
          <CardDescription>Removes this device's saved token.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout}>Sign out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
