"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateSettings, deleteAccountData, type SettingsInput } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "pt", label: "Português" },
  { value: "tr", label: "Türkçe" },
  { value: "hi", label: "हिन्दी" },
] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  targetRole: z.string().max(120),
  industry: z.string().max(120),
  language: z.enum(["en", "es", "de", "fr", "pt", "tr", "hi"]),
  emailReports: z.boolean(),
  marketingEmails: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function SettingsClient({
  email,
  initial,
}: {
  email: string;
  initial: FormValues;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  const onSubmit = async (values: FormValues) => {
    const result = await updateSettings(values as SettingsInput);
    if (result.ok) {
      toast.success("Settings saved");
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not save settings");
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const result = await deleteAccountData();
      if (!result.ok) {
        toast.error(result.error ?? "Could not delete account");
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Your account data has been deleted");
      router.push("/");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Used to personalize your AI results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetRole">Target role</Label>
              <Input
                id="targetRole"
                placeholder="e.g. Engineering Manager"
                {...register("targetRole")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" placeholder="e.g. SaaS / Fintech" {...register("industry")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred language</Label>
            <Controller
              control={control}
              name="language"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="sm:max-w-xs" aria-label="Preferred language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Interface language for generated reports and emails.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Controller
            control={control}
            name="emailReports"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">Weekly improvement reports</div>
                  <p className="text-xs text-muted-foreground">
                    A weekly email with your score changes and suggested next steps.
                  </p>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Weekly improvement reports" />
              </div>
            )}
          />
          <Controller
            control={control}
            name="marketingEmails"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">Product updates</div>
                  <p className="text-xs text-muted-foreground">
                    Occasional news about new features and tips.
                  </p>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Product updates" />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Button type="submit" variant="gradient" loading={isSubmitting} disabled={!isDirty}>
          {!isSubmitting && <Save />}
          Save changes
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 /> Delete account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This permanently deletes your profile, analyses, posts, and all
                other data. Active subscriptions should be canceled from the
                Billing page first. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                onClick={deleteAccount}
                loading={deleting}
              >
                Yes, delete everything
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}
